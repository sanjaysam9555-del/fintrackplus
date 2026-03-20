/**
 * React hook that orchestrates the airtight sync system
 * - Realtime + periodic healing refresh
 * - Background sync on visibility change
 * - Online/offline detection with auto-retry
 * - Optimistic updates with queue management
 * - Stabilized refs to prevent effect re-runs
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useFinanceStore } from '@/lib/store';
import {
  fetchAllCloudData,
  createRealtimeSubscription,
  createHealingInterval,
  setupBackgroundSync,
  setupOnlineListener,
  processSyncQueue,
  getQueueSize,
  addToSyncQueue,
  SyncEntityType,
  SyncOperationType,
} from '@/lib/syncEngine';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Ensure "Not Specified" vendor + categories exist in backend for this org
// Only runs once per session via sessionStorage gate
const ensureDefaultTaxonomy = async (userId: string) => {
  const SESSION_KEY = 'fintrack_taxonomy_ensured';
  if (sessionStorage.getItem(SESSION_KEY)) return;

  try {
    const { data: orgData } = await supabase.rpc('get_user_org_id', { _user_id: userId });
    const orgId = orgData as string | null;

    const [{ data: vendors }, { data: cats }] = await Promise.all([
      supabase.from('vendors').select('id, name').eq('name', 'Not Specified'),
      supabase.from('categories').select('id, name, type').eq('name', 'Not Specified'),
    ]);

    const inserts: (() => PromiseLike<unknown>)[] = [];

    if (!vendors || vendors.length === 0) {
      inserts.push(() => supabase.from('vendors').insert({ id: uuidv4(), user_id: userId, org_id: orgId, name: 'Not Specified', icon: 'Store', color: '#6B7280' }));
    }

    const hasExpense = cats?.some(c => c.type === 'expense');
    const hasIncome = cats?.some(c => c.type === 'income');

    if (!hasExpense) {
      inserts.push(() => supabase.from('categories').insert({ id: uuidv4(), user_id: userId, org_id: orgId, name: 'Not Specified', icon: 'other', color: '#6B7280', type: 'expense' }));
    }
    if (!hasIncome) {
      inserts.push(() => supabase.from('categories').insert({ id: uuidv4(), user_id: userId, org_id: orgId, name: 'Not Specified', icon: 'other', color: '#6B7280', type: 'income' }));
    }

    if (inserts.length > 0) {
      for (const fn of inserts) await fn();
      console.log('[SyncEngine] Created missing default taxonomy entries');
    }

    sessionStorage.setItem(SESSION_KEY, '1');
  } catch (err) {
    console.error('[SyncEngine] ensureDefaultTaxonomy failed:', err);
  }
};

export const useSyncEngine = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState('');
  const [pendingCount, setPendingCount] = useState(getQueueSize());
  
  const {
    setCloudData,
    setSyncStatus,
    setLastSyncedAt,
  } = useFinanceStore();

  // Refs for cleanup
  const realtimeRef = useRef<{ unsubscribe: () => void } | null>(null);
  const healingRef = useRef<{ stop: () => void } | null>(null);
  const backgroundRef = useRef<{ cleanup: () => void } | null>(null);
  const onlineRef = useRef<{ cleanup: () => void } | null>(null);
  const isMounted = useRef(true);

  // Stable refs for store setters (they never change identity but satisfy exhaustive-deps)
  const setCloudDataRef = useRef(setCloudData);
  const setSyncStatusRef = useRef(setSyncStatus);
  const setLastSyncedAtRef = useRef(setLastSyncedAt);
  setCloudDataRef.current = setCloudData;
  setSyncStatusRef.current = setSyncStatus;
  setLastSyncedAtRef.current = setLastSyncedAt;

  // Update pending count
  const refreshPendingCount = useCallback(() => {
    setPendingCount(getQueueSize());
  }, []);

  // Core sync function - fetches cloud data (always silent)
  const syncFromCloud = useCallback(async (options: { showToast?: boolean; isBackground?: boolean } = {}) => {
    const { showToast = false } = options;
    
    if (!user || !navigator.onLine) return;

    try {
      const { data, error } = await fetchAllCloudData(user.id);

      if (!isMounted.current) return;

      if (error || !data) {
        throw new Error(error || 'Unknown error fetching data');
      }

      setCloudDataRef.current(data);
      setLastSyncedAtRef.current(new Date().toISOString());

      // Fetch org info (name + logo)
      try {
        const { data: orgData } = await supabase.rpc('get_user_org_id', { _user_id: user.id });
        if (orgData) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name, logo_url')
            .eq('id', orgData)
            .maybeSingle();
          if (org) {
            useFinanceStore.getState().setOrgInfo(org.name, (org as any).logo_url || null);
          }
        }
      } catch (e) {
        console.error('[SyncEngine] Org info fetch failed:', e);
      }
      
      refreshPendingCount();
      setSyncStatusRef.current('synced');

      if (showToast) {
        const remaining = getQueueSize();
        if (remaining > 0) {
          toast.info(`Refreshed. ${remaining} pending.`);
        } else {
          toast.success('Synced');
        }
      }
    } catch (error) {
      console.error('[SyncEngine] Fetch failed:', error);
      if (!isMounted.current) return;
      setSyncStatusRef.current('error');
      if (showToast) {
        toast.error('Sync failed');
      }
    }
  }, [user, refreshPendingCount]);

  // Push pending operations to cloud (always silent)
  const pushToCloud = useCallback(async (options: { showToast?: boolean } = {}) => {
    const { showToast = false } = options;
    
    if (!user || !navigator.onLine) return { synced: 0, failed: 0, remaining: getQueueSize() };

    const pending = getQueueSize();
    if (pending === 0) return { synced: 0, failed: 0, remaining: 0 };

    const result = await processSyncQueue();
    refreshPendingCount();

    if (!isMounted.current) return result;

    if (result.failed > 0) {
      setSyncStatusRef.current('error');
      if (showToast) toast.error(`${result.failed} change${result.failed > 1 ? 's' : ''} failed`);
    } else if (result.synced > 0) {
      setSyncStatusRef.current('synced');
      setLastSyncedAtRef.current(new Date().toISOString());
    }

    return result;
  }, [user, refreshPendingCount]);

  // Full sync: push pending, then pull from cloud
  const fullSync = useCallback(async (options: { showToast?: boolean } = {}) => {
    const { showToast = false } = options;
    
    if (!user) return;

    try {
      await pushToCloud({ showToast: false });
      await syncFromCloud({ showToast });
    } catch (error) {
      console.error('[SyncEngine] Full sync failed:', error);
    }
  }, [user, pushToCloud, syncFromCloud]);

  // Store callback refs so the setup effect doesn't depend on them
  const syncFromCloudRef = useRef(syncFromCloud);
  const pushToCloudRef = useRef(pushToCloud);
  const fullSyncRef = useRef(fullSync);
  syncFromCloudRef.current = syncFromCloud;
  pushToCloudRef.current = pushToCloud;
  fullSyncRef.current = fullSync;

  // Manual refresh (user-triggered)
  const refreshData = useCallback(async () => {
    setIsSyncing(true);
    try {
      await fullSync({ showToast: false });
    } finally {
      setIsSyncing(false);
    }
  }, [fullSync]);

  // Queue an operation for sync
  const queueOperation = useCallback((
    type: SyncOperationType,
    entity: SyncEntityType,
    entityId: string,
    data: Record<string, unknown>
  ) => {
    if (!user) return;

    addToSyncQueue({
      type,
      entity,
      entityId,
      data,
      userId: user.id,
    });
    
    refreshPendingCount();

    if (navigator.onLine) {
      setTimeout(() => {
        pushToCloudRef.current({ showToast: false }).catch(console.error);
      }, 100);
    }
  }, [user, refreshPendingCount]);

  // Check for onboarding + load cloud theme
  useEffect(() => {
    if (!user) return;

    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile && !profile.onboarding_completed) {
        setShowOnboarding(true);
        setUserName(profile.name || '');
      }
    };

    import('./useTheme').then(({ loadCloudTheme }) => {
      loadCloudTheme(user.id);
    });

    checkOnboarding();
  }, [user]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    if (!user) return;
    
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id);
    
    setShowOnboarding(false);
  }, [user]);

  // Setup all sync mechanisms — depends ONLY on `user` thanks to refs
  useEffect(() => {
    if (!user) return;

    isMounted.current = true;

    const initSync = async () => {
      await ensureDefaultTaxonomy(user.id);
      await fullSyncRef.current({ showToast: false });
    };
    initSync();

    // 1. Realtime subscriptions
    realtimeRef.current = createRealtimeSubscription(user.id, () => {
      syncFromCloudRef.current({ showToast: false, isBackground: true });
    });

    // 2. Periodic healing refresh (every 2 minutes)
    healingRef.current = createHealingInterval(async () => {
      await pushToCloudRef.current({ showToast: false });
      await syncFromCloudRef.current({ showToast: false, isBackground: true });
    });

    // 3. Background sync on visibility change
    backgroundRef.current = setupBackgroundSync(async () => {
      await fullSyncRef.current({ showToast: false });
    });

    // 4. Online/offline detection
    onlineRef.current = setupOnlineListener(
      () => {
        setIsOnline(true);
        toast.success('Back online');
        fullSyncRef.current({ showToast: false });
      },
      () => {
        setIsOnline(false);
        toast.warning('You are offline');
        setSyncStatusRef.current('error');
      }
    );

    return () => {
      isMounted.current = false;
      realtimeRef.current?.unsubscribe();
      healingRef.current?.stop();
      backgroundRef.current?.cleanup();
      onlineRef.current?.cleanup();
    };
  }, [user]); // Only depends on user — callbacks accessed via refs

  return {
    isOnline,
    isSyncing,
    pendingCount,
    showOnboarding,
    userName,
    
    refreshData,
    queueOperation,
    completeOnboarding,
    
    fetchCloudData: syncFromCloud,
    isRefreshing: isSyncing,
  };
};

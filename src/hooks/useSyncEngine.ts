/**
 * React hook that orchestrates the airtight sync system
 * - Realtime + periodic healing refresh
 * - Background sync on visibility change
 * - Online/offline detection with auto-retry
 * - Optimistic updates with queue management
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

  // Update pending count
  const refreshPendingCount = useCallback(() => {
    setPendingCount(getQueueSize());
  }, []);

  // Core sync function - fetches cloud data (silent by default)
  const syncFromCloud = useCallback(async (options: { showToast?: boolean; isBackground?: boolean } = {}) => {
    const { showToast = false, isBackground = false } = options;
    
    if (!user || !navigator.onLine) return;
    if (!isBackground) setIsSyncing(true);
    // Don't set 'syncing' status for background syncs to avoid UI flicker
    if (!isBackground) setSyncStatus('syncing');

    try {
      const { data, error } = await fetchAllCloudData(user.id);

      if (!isMounted.current) return;

      if (error || !data) {
        throw new Error(error || 'Unknown error fetching data');
      }

      setCloudData(data);
      setLastSyncedAt(new Date().toISOString());
      
      refreshPendingCount();
      
      // Only set synced if not background (background syncs shouldn't change status)
      if (!isBackground) {
        setSyncStatus('synced');
      }

      if (showToast && !isBackground) {
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
      if (!isBackground) {
        setSyncStatus('error');
        if (showToast) {
          toast.error('Sync failed');
        }
      }
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  }, [user, setCloudData, setSyncStatus, setLastSyncedAt, refreshPendingCount]);

  // Push pending operations to cloud (silent by default now)
  const pushToCloud = useCallback(async (options: { showToast?: boolean } = {}) => {
    const { showToast = false } = options;
    
    if (!user || !navigator.onLine) return { synced: 0, failed: 0, remaining: getQueueSize() };

    const pending = getQueueSize();
    if (pending === 0) return { synced: 0, failed: 0, remaining: 0 };

    // Don't show syncing status for background pushes
    if (showToast) {
      setIsSyncing(true);
      setSyncStatus('syncing');
    }

    const result = await processSyncQueue();
    refreshPendingCount();

    if (!isMounted.current) return result;

    if (result.failed > 0 && showToast) {
      setSyncStatus('error');
      toast.error(`${result.failed} change${result.failed > 1 ? 's' : ''} failed`);
    } else if (result.synced > 0 && showToast) {
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toISOString());
      toast.success(`Synced ${result.synced} change${result.synced > 1 ? 's' : ''}`);
    }

    if (showToast) setIsSyncing(false);
    return result;
  }, [user, setSyncStatus, setLastSyncedAt, refreshPendingCount]);

  // Full sync: push pending, then pull from cloud (with timeout safety)
  const fullSync = useCallback(async (options: { showToast?: boolean } = {}) => {
    const { showToast = false } = options;
    
    if (!user) return;

    setIsSyncing(true);
    
    // Safety timeout to prevent stuck spinner
    const timeoutId = setTimeout(() => {
      if (isMounted.current) setIsSyncing(false);
    }, 15000);
    
    try {
      // First push any pending changes (silently)
      await pushToCloud({ showToast: false });
      
      // Then fetch latest from cloud
      await syncFromCloud({ showToast, isBackground: false });
    } finally {
      clearTimeout(timeoutId);
      if (isMounted.current) setIsSyncing(false);
    }
  }, [user, pushToCloud, syncFromCloud]);

  // Manual refresh (user-triggered) - shows toast
  const refreshData = useCallback(async () => {
    if (isSyncing) return; // Prevent double-refresh
    await fullSync({ showToast: true });
  }, [fullSync, isSyncing]);

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

    // Try to push immediately if online
    if (navigator.onLine) {
      // Use setTimeout to allow the local state update to complete first
      setTimeout(() => {
        pushToCloud({ showToast: false }).catch(console.error);
      }, 100);
    }
  }, [user, refreshPendingCount, pushToCloud]);

  // Check for onboarding
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

  // Setup all sync mechanisms
  useEffect(() => {
    if (!user) return;

    isMounted.current = true;

    // Initial sync
    fullSync({ showToast: false });

    // 1. Realtime subscriptions
    realtimeRef.current = createRealtimeSubscription(user.id, () => {
      syncFromCloud({ showToast: false, isBackground: true });
    });

    // 2. Periodic healing refresh (every 30s)
    healingRef.current = createHealingInterval(async () => {
      await pushToCloud({ showToast: false });
      await syncFromCloud({ showToast: false, isBackground: true });
    });

    // 3. Background sync on visibility change
    backgroundRef.current = setupBackgroundSync(async () => {
      await fullSync({ showToast: false });
    });

    // 4. Online/offline detection
    onlineRef.current = setupOnlineListener(
      () => {
        setIsOnline(true);
        toast.success('Back online');
        fullSync({ showToast: false });
      },
      () => {
        setIsOnline(false);
        toast.warning('You are offline');
        setSyncStatus('error');
      }
    );

    return () => {
      isMounted.current = false;
      realtimeRef.current?.unsubscribe();
      healingRef.current?.stop();
      backgroundRef.current?.cleanup();
      onlineRef.current?.cleanup();
    };
  }, [user, fullSync, syncFromCloud, pushToCloud, setSyncStatus]);

  return {
    // State
    isOnline,
    isSyncing,
    pendingCount,
    showOnboarding,
    userName,
    
    // Actions
    refreshData,
    queueOperation,
    completeOnboarding,
    
    // For compatibility with existing code
    fetchCloudData: syncFromCloud,
    isRefreshing: isSyncing,
  };
};

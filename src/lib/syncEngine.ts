/**
 * Airtight Sync Engine
 * - Realtime subscriptions for instant updates
 * - Periodic healing refresh (every 30s)
 * - Last-write-wins conflict resolution
 * - Optimistic local-first with background push
 * - Exponential backoff retry queue
 * - Background sync via visibility API
 */

import { supabase } from '@/integrations/supabase/client';
import { Transaction, Category, Vendor, Project, ProjectLabel } from './types';

// ============ Types ============

export type SyncEntityType = 'transaction' | 'category' | 'vendor' | 'project' | 'partner' | 'project_label';
export type SyncOperationType = 'insert' | 'update' | 'delete';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entity: SyncEntityType;
  entityId: string;
  data: Record<string, unknown>;
  userId: string;
  timestamp: string;
  retryCount: number;
  lastError?: string;
  nextRetryAt?: string;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingOperations: SyncOperation[];
  syncError: string | null;
}

// ============ Storage Keys ============

const PENDING_OPS_KEY = 'fintrack_sync_queue';
const SYNC_STATE_KEY = 'fintrack_sync_state';
const RECENTLY_SYNCED_KEY = 'fintrack_recently_synced';

// ============ Retry Configuration ============

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 60000;
const RECENTLY_SYNCED_TTL_MS = 10000; // Keep recently synced items for 10 seconds

// ============ Helper Functions ============

const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getBackoffDelay = (retryCount: number): number => {
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
  // Add jitter (±20%)
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.floor(delay + jitter);
};

const getTableName = (entity: SyncEntityType): 'transactions' | 'categories' | 'vendors' | 'projects' | 'partners' | 'project_labels' => {
  switch (entity) {
    case 'transaction': return 'transactions';
    case 'category': return 'categories';
    case 'vendor': return 'vendors';
    case 'project': return 'projects';
    case 'partner': return 'partners';
    case 'project_label': return 'project_labels';
  }
};

// ============ Recently Synced Tracking ============
// Prevents race condition where cloud refresh happens before DB propagation

interface RecentlySyncedItem {
  entityType: string;
  entityId: string;
  syncedAt: number;
}

export const loadRecentlySynced = (): RecentlySyncedItem[] => {
  try {
    const stored = localStorage.getItem(RECENTLY_SYNCED_KEY);
    const items: RecentlySyncedItem[] = stored ? JSON.parse(stored) : [];
    // Filter out expired items
    const now = Date.now();
    return items.filter(item => now - item.syncedAt < RECENTLY_SYNCED_TTL_MS);
  } catch {
    return [];
  }
};

const saveRecentlySynced = (items: RecentlySyncedItem[]): void => {
  try {
    localStorage.setItem(RECENTLY_SYNCED_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('[SyncEngine] Failed to save recently synced:', error);
  }
};

export const addToRecentlySynced = (entityType: string, entityId: string): void => {
  const items = loadRecentlySynced();
  items.push({ entityType, entityId, syncedAt: Date.now() });
  saveRecentlySynced(items);
};

// ============ Queue Management ============

export const loadSyncQueue = (): SyncOperation[] => {
  try {
    const stored = localStorage.getItem(PENDING_OPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveSyncQueue = (operations: SyncOperation[]): void => {
  try {
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(operations));
  } catch (error) {
    console.error('[SyncEngine] Failed to save queue:', error);
  }
};

export const addToSyncQueue = (
  operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>
): SyncOperation => {
  const queue = loadSyncQueue();
  
  // Check for existing operation on the same entity - merge if update
  const existingIndex = queue.findIndex(
    op => op.entityId === operation.entityId && op.entity === operation.entity
  );
  
  const newOp: SyncOperation = {
    ...operation,
    id: generateId(),
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };
  
  if (existingIndex >= 0) {
    const existing = queue[existingIndex];
    
    // If existing is insert and new is update, merge data into insert
    if (existing.type === 'insert' && operation.type === 'update') {
      queue[existingIndex] = {
        ...existing,
        data: { ...existing.data, ...operation.data },
        timestamp: newOp.timestamp,
      };
      saveSyncQueue(queue);
      return queue[existingIndex];
    }
    
    // If new is delete, remove insert or update from queue
    if (operation.type === 'delete') {
      if (existing.type === 'insert') {
        // Item was never synced, just remove from queue
        queue.splice(existingIndex, 1);
        saveSyncQueue(queue);
        return newOp; // Return but don't add to queue
      } else {
        // Replace update with delete
        queue[existingIndex] = newOp;
        saveSyncQueue(queue);
        return newOp;
      }
    }
    
    // For other cases, replace existing with new
    queue[existingIndex] = newOp;
  } else {
    queue.push(newOp);
  }
  
  saveSyncQueue(queue);
  return newOp;
};

export const removeFromSyncQueue = (operationId: string): void => {
  const queue = loadSyncQueue();
  saveSyncQueue(queue.filter(op => op.id !== operationId));
};

export const getQueueSize = (): number => {
  return loadSyncQueue().length;
};

// ============ Sync Operations ============

// ============ Org ID Resolution (cached per session) ============

let _cachedOrgId: string | null = null;

export const resolveOrgId = async (userId: string): Promise<string | null> => {
  if (_cachedOrgId) return _cachedOrgId;
  try {
    const { data } = await supabase.rpc('get_user_org_id', { _user_id: userId });
    _cachedOrgId = (data as string) || null;
    return _cachedOrgId;
  } catch (err) {
    console.error('[SyncEngine] Failed to resolve org_id:', err);
    return null;
  }
};

// Clear cached org on logout (call from auth hook if needed)
export const clearCachedOrgId = () => { _cachedOrgId = null; };

export const processOperation = async (operation: SyncOperation): Promise<{ success: boolean; error?: string }> => {
  const { type, entity, entityId, data, userId } = operation;
  const tableName = getTableName(entity);
  
  try {
    let result;
    
    switch (type) {
      case 'insert': {
        // Resolve org_id for inserts so RLS INSERT checks pass
        const orgId = await resolveOrgId(userId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (supabase.from(tableName) as any).upsert(
          {
            ...data,
            id: entityId,
            user_id: userId,
            org_id: orgId,
          },
          { onConflict: 'id' }
        );
        break;
      }
        
      case 'update': {
        // RLS handles org-scoped access — no need for .eq('user_id', userId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (supabase.from(tableName) as any).update(data).eq('id', entityId);
        break;
      }
        
      case 'delete': {
        // RLS handles org-scoped access — no need for .eq('user_id', userId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (supabase.from(tableName) as any).delete().eq('id', entityId);
        break;
      }
    }
    
    if (result?.error) {
      return { success: false, error: result.error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

// Mutex to prevent concurrent queue processing
let _isProcessingQueue = false;
let _pendingReprocess = false;

const processQueueInternal = async (): Promise<{ synced: number; failed: number; remaining: number }> => {
  // Take a snapshot of the queue at the start
  const snapshotQueue = loadSyncQueue();
  
  if (snapshotQueue.length === 0) {
    return { synced: 0, failed: 0, remaining: 0 };
  }
  
  // Sort by timestamp to process in order
  const sortedQueue = [...snapshotQueue].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  let synced = 0;
  let failed = 0;
  
  // Track what happened to each operation we processed
  const processedIds = new Set<string>(); // successfully synced or permanently dropped
  const retriedOps = new Map<string, SyncOperation>(); // failed but will retry
  
  for (const operation of sortedQueue) {
    // Skip if not ready for retry
    if (operation.nextRetryAt && new Date(operation.nextRetryAt) > new Date()) {
      continue; // leave it in queue as-is
    }
    
    const { success, error } = await processOperation(operation);
    
    if (success) {
      synced++;
      processedIds.add(operation.id);
      addToRecentlySynced(operation.entity, operation.entityId);
    } else {
      failed++;
      
      if (operation.retryCount >= MAX_RETRIES) {
        processedIds.add(operation.id); // drop it
        const isTransfer = operation.data?.vendor === 'Partner Transfer';
        console.error(`[SyncEngine] PERMANENTLY DROPPING operation after ${MAX_RETRIES} retries:`, {
          opId: operation.id,
          entity: operation.entity,
          entityId: operation.entityId,
          isTransfer,
          lastError: error,
          data: isTransfer ? operation.data : undefined,
        });
        // Surface permanent failure to user for transfers
        if (isTransfer && typeof window !== 'undefined') {
          import('sonner').then(({ toast }) => {
            toast.error('A partner transfer failed to sync after multiple retries. Please try again.');
          });
        }
      } else {
        const nextDelay = getBackoffDelay(operation.retryCount);
        retriedOps.set(operation.id, {
          ...operation,
          retryCount: operation.retryCount + 1,
          lastError: error,
          nextRetryAt: new Date(Date.now() + nextDelay).toISOString(),
        });
      }
    }
  }
  
  // === MERGE-SAFE RECONCILIATION ===
  // Re-read the current queue (may have new ops added during our async processing)
  const currentQueue = loadSyncQueue();
  const reconciledQueue = currentQueue
    .filter(op => !processedIds.has(op.id)) // remove successfully processed / dropped
    .map(op => retriedOps.has(op.id) ? retriedOps.get(op.id)! : op); // update retry metadata
  
  saveSyncQueue(reconciledQueue);
  
  return { synced, failed, remaining: reconciledQueue.length };
};

export const processSyncQueue = async (): Promise<{ synced: number; failed: number; remaining: number }> => {
  if (_isProcessingQueue) {
    _pendingReprocess = true;
    return { synced: 0, failed: 0, remaining: getQueueSize() };
  }
  
  _isProcessingQueue = true;
  let totalSynced = 0;
  let totalFailed = 0;
  let remaining = 0;
  
  try {
    const result = await processQueueInternal();
    totalSynced += result.synced;
    totalFailed += result.failed;
    remaining = result.remaining;
    
    // Drain loop: keep processing while new ops were added during our pass
    while (_pendingReprocess) {
      _pendingReprocess = false;
      const pass = await processQueueInternal();
      totalSynced += pass.synced;
      totalFailed += pass.failed;
      remaining = pass.remaining;
    }
    
    return { synced: totalSynced, failed: totalFailed, remaining };
  } finally {
    _isProcessingQueue = false;
  }
};

// ============ Cloud Data Fetching ============

import { Partner, ProjectLabel as ProjectLabelType } from './types';

export interface CloudData {
  profile?: { name: string; avatar?: string | null };
  orgName?: string;
  orgLogoUrl?: string | null;
  categories: Category[];
  vendors: Vendor[];
  projects: Project[];
  transactions: Transaction[];
  partners: Partner[];
  projectLabels: ProjectLabelType[];
}

// ============ Fetch Throttle ============
let _lastFetchTimestamp = 0;
let _lastFetchResult: { data: CloudData | null; error: string | null } | null = null;
const FETCH_THROTTLE_MS = 5000; // 5 second minimum gap between fetches

export const fetchAllCloudData = async (userId: string): Promise<{ data: CloudData | null; error: string | null }> => {
  const now = Date.now();
  if (_lastFetchResult && now - _lastFetchTimestamp < FETCH_THROTTLE_MS) {
    console.log('[SyncEngine] Fetch throttled, returning cached result');
    return _lastFetchResult;
  }
  try {
    // Paginated fetch for transactions (may exceed 1000 rows)
    // RLS now scopes by org_id automatically, no need for explicit user_id filter
    const fetchAllTransactions = async () => {
      const allData: Record<string, unknown>[] = [];
      let offset = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })
          .range(offset, offset + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData.push(...(data as unknown as Record<string, unknown>[]));
        if (data.length < batchSize) break;
        offset += batchSize;
      }
      return allData;
    };

    // RLS policies now scope all queries to the user's org automatically
    const [
      profileResult,
      profileRowsResult,
      categoriesResult,
      vendorsResult,
      projectsResult,
      cloudTransactions,
      partnersResult,
      projectLabelsResult,
      orgResult
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('user_id, name, avatar_url'),
      supabase.from('categories').select('*'),
      supabase.from('vendors').select('*'),
      supabase.from('projects').select('*'),
      fetchAllTransactions(),
      supabase.from('partners').select('*'),
      supabase.from('project_labels').select('*'),
      supabase.from('organizations').select('id, name, logo_url').limit(1).maybeSingle()
    ]);

    const firstError =
      profileResult.error ||
      profileRowsResult.error ||
      categoriesResult.error ||
      vendorsResult.error ||
      projectsResult.error ||
      partnersResult.error ||
      projectLabelsResult.error;

    if (firstError) {
      return { data: null, error: firstError.message };
    }

    const profile = profileResult.data;
    const orgProfiles = profileRowsResult.data || [];
    const profileByUserId = new Map(orgProfiles.map(p => [p.user_id, p]));
    const cloudCategories = categoriesResult.data || [];
    const cloudVendors = vendorsResult.data || [];
    const cloudProjects = projectsResult.data || [];
    const cloudPartners = partnersResult.data || [];
    const cloudProjectLabels = projectLabelsResult.data || [];
    const orgData = orgResult.data;
    const result: { data: CloudData; error: null } = {
      data: {
        profile: profile ? { name: profile.name, avatar: profile.avatar_url } : undefined,
        orgName: orgData?.name || undefined,
        orgLogoUrl: orgData?.logo_url || undefined,
        categories: cloudCategories.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: c.type as 'income' | 'expense'
        })),
        vendors: cloudVendors.map(v => ({
          id: v.id,
          name: v.name,
          icon: v.icon || undefined,
          color: v.color || undefined
        })),
        projects: cloudProjects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || undefined,
          internalCost: Number(p.budget_limit),
          clientCost: Number((p as unknown as { margin?: number }).margin) || 0,
          expectedMargin: Number((p as unknown as { expected_margin?: number }).expected_margin) || 0,
          archived: (p as unknown as { archived?: boolean }).archived || false,
          labelIds: (() => {
            const raw = (p as unknown as { label_ids?: unknown }).label_ids;
            if (Array.isArray(raw)) return raw as string[];
            if (typeof raw === 'string') { try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
            return [];
          })(),
          assignedEmployeeIds: (() => {
            const raw = (p as unknown as { assigned_employee_ids?: unknown }).assigned_employee_ids;
            if (Array.isArray(raw)) return raw as string[];
            if (typeof raw === 'string') { try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
            return [];
          })(),
          color: p.color,
          eventDate: (p as unknown as { event_date?: string }).event_date || undefined,
          startDate: (p as unknown as { start_date?: string }).start_date || undefined,
          createdAt: p.created_at.split('T')[0]
        })),
        transactions: (cloudTransactions as any[]).map(t => ({
          id: t.id as string,
          userId: t.user_id as string,
          type: t.type as 'income' | 'expense',
          amount: Number(t.amount),
          title: t.title || undefined,
          vendor: t.vendor as string,
          categoryId: t.category_id || '',
          projectId: t.project_id || undefined,
          handledBy: t.handled_by || undefined,
          paymentMethod: t.payment_method as 'cash' | 'online',
          date: t.date as string,
          time: t.time as string,
          notes: t.notes || undefined,
          isRecurring: t.is_recurring || false,
          recurringFrequency: t.recurring_frequency as 'weekly' | 'monthly' | undefined,
          createdAt: t.created_at || new Date().toISOString(),
        })),
        partners: cloudPartners.map(p => {
          const isCompanyAccount = !!(p as { is_company_account?: boolean }).is_company_account;
          const linkedProfile = isCompanyAccount ? undefined : profileByUserId.get((p as { user_id?: string }).user_id);
          return {
            id: (p as { id: string }).id,
            name: isCompanyAccount ? (p as { name: string }).name : (linkedProfile?.name || (p as { name: string }).name),
            color: (p as { color: string }).color,
            initialCashBalance: Number((p as { initial_cash_balance: number }).initial_cash_balance) || 0,
            initialOnlineBalance: Number((p as { initial_online_balance: number }).initial_online_balance) || 0,
            avatarUrl: isCompanyAccount ? undefined : (linkedProfile?.avatar_url || (p as { avatar_url?: string }).avatar_url || undefined),
            userId: (p as { user_id?: string }).user_id,
            role: (p as { role?: string }).role || 'owner',
            isCompanyAccount,
            createdAt: (p as { created_at: string }).created_at.split('T')[0]
          };
        }),
        projectLabels: cloudProjectLabels.map(l => ({
          id: (l as { id: string }).id,
          name: (l as { name: string }).name,
          color: (l as { color: string }).color,
          createdAt: (l as { created_at: string }).created_at.split('T')[0]
        }))
      },
      error: null
    };

    _lastFetchTimestamp = Date.now();
    _lastFetchResult = result;
    return result;
  } catch (error) {
    return { data: null, error: String(error) };
  }
};

// ============ Realtime Subscriptions ============

export type RealtimeCallback = () => void;

export const createRealtimeSubscription = (
  userId: string,
  onDataChange: RealtimeCallback
): { unsubscribe: () => void } => {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  
  const debouncedCallback = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(onDataChange, 1000);
  };

  // Subscribe to all changes on relevant tables (RLS handles org scoping)
  const channel = supabase
    .channel(`user-data-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, debouncedCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, debouncedCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, debouncedCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, debouncedCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'project_labels' }, debouncedCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'project_documents' }, debouncedCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, debouncedCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'change_approvals' }, debouncedCallback)
    .subscribe();

  return {
    unsubscribe: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    }
  };
};

// ============ Healing Refresh ============

const HEAL_INTERVAL_MS = 120000; // 2 minutes

export const createHealingInterval = (
  onHeal: () => Promise<void>
): { stop: () => void } => {
  const intervalId = setInterval(() => {
    if (navigator.onLine) {
      onHeal().catch(err => console.error('[SyncEngine] Healing refresh failed:', err));
    }
  }, HEAL_INTERVAL_MS);

  return {
    stop: () => clearInterval(intervalId)
  };
};

// ============ Background Sync (Visibility API) ============

export const setupBackgroundSync = (
  onBecomeVisible: () => Promise<void>
): { cleanup: () => void } => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      onBecomeVisible().catch(err => console.error('[SyncEngine] Background sync failed:', err));
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return {
    cleanup: () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  };
};

// ============ Online/Offline Detection ============

export const setupOnlineListener = (
  onOnline: () => void,
  onOffline: () => void
): { cleanup: () => void } => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return {
    cleanup: () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    }
  };
};

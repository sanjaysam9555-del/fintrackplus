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
import { Transaction, Category, Vendor, Project } from './types';

// ============ Types ============

export type SyncEntityType = 'transaction' | 'category' | 'vendor' | 'project';
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

// ============ Retry Configuration ============

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 60000;

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

const getTableName = (entity: SyncEntityType): 'transactions' | 'categories' | 'vendors' | 'projects' => {
  switch (entity) {
    case 'transaction': return 'transactions';
    case 'category': return 'categories';
    case 'vendor': return 'vendors';
    case 'project': return 'projects';
  }
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

export const processOperation = async (operation: SyncOperation): Promise<{ success: boolean; error?: string }> => {
  const { type, entity, entityId, data, userId } = operation;
  const tableName = getTableName(entity);
  
  try {
    let result;
    
    switch (type) {
      case 'insert':
        // Use upsert for idempotency (last-write-wins)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (supabase.from(tableName) as any).upsert(
          {
            ...data,
            id: entityId,
            user_id: userId,
          },
          { onConflict: 'id' }
        );
        break;
        
      case 'update':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (supabase.from(tableName) as any)
          .update(data)
          .eq('id', entityId)
          .eq('user_id', userId);
        break;
        
      case 'delete':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (supabase.from(tableName) as any)
          .delete()
          .eq('id', entityId)
          .eq('user_id', userId);
        break;
    }
    
    if (result?.error) {
      return { success: false, error: result.error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const processSyncQueue = async (): Promise<{ synced: number; failed: number; remaining: number }> => {
  const queue = loadSyncQueue();
  
  if (queue.length === 0) {
    return { synced: 0, failed: 0, remaining: 0 };
  }
  
  // Sort by timestamp to process in order
  const sortedQueue = [...queue].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  let synced = 0;
  let failed = 0;
  const updatedQueue: SyncOperation[] = [];
  
  for (const operation of sortedQueue) {
    // Skip if not ready for retry
    if (operation.nextRetryAt && new Date(operation.nextRetryAt) > new Date()) {
      updatedQueue.push(operation);
      continue;
    }
    
    const { success, error } = await processOperation(operation);
    
    if (success) {
      synced++;
      // Don't add to updatedQueue (removes from queue)
    } else {
      failed++;
      
      if (operation.retryCount >= MAX_RETRIES) {
        // Max retries reached, drop operation but log it
        console.error(`[SyncEngine] Dropping operation after ${MAX_RETRIES} retries:`, operation, error);
      } else {
        // Schedule retry with exponential backoff
        const nextDelay = getBackoffDelay(operation.retryCount);
        updatedQueue.push({
          ...operation,
          retryCount: operation.retryCount + 1,
          lastError: error,
          nextRetryAt: new Date(Date.now() + nextDelay).toISOString(),
        });
      }
    }
  }
  
  saveSyncQueue(updatedQueue);
  
  return { synced, failed, remaining: updatedQueue.length };
};

// ============ Cloud Data Fetching ============

export interface CloudData {
  profile?: { name: string; avatar?: string | null };
  categories: Category[];
  vendors: Vendor[];
  projects: Project[];
  transactions: Transaction[];
}

export const fetchAllCloudData = async (userId: string): Promise<{ data: CloudData | null; error: string | null }> => {
  try {
    const [
      profileResult,
      categoriesResult,
      vendorsResult,
      projectsResult,
      transactionsResult
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('categories').select('*').eq('user_id', userId),
      supabase.from('vendors').select('*').eq('user_id', userId),
      supabase.from('projects').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false })
    ]);

    const firstError =
      profileResult.error ||
      categoriesResult.error ||
      vendorsResult.error ||
      projectsResult.error ||
      transactionsResult.error;

    if (firstError) {
      return { data: null, error: firstError.message };
    }

    const profile = profileResult.data;
    const cloudCategories = categoriesResult.data || [];
    const cloudVendors = vendorsResult.data || [];
    const cloudProjects = projectsResult.data || [];
    const cloudTransactions = transactionsResult.data || [];

    return {
      data: {
        profile: profile ? { name: profile.name, avatar: profile.avatar_url } : undefined,
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
          budgetLimit: Number(p.budget_limit),
          margin: Number((p as unknown as { margin?: number }).margin) || 0,
          archived: (p as unknown as { archived?: boolean }).archived || false,
          color: p.color,
          createdAt: p.created_at.split('T')[0]
        })),
        transactions: cloudTransactions.map(t => ({
          id: t.id,
          type: t.type as 'income' | 'expense',
          amount: Number(t.amount),
          title: (t as unknown as { title?: string }).title || undefined,
          vendor: t.vendor,
          categoryId: t.category_id || '',
          projectId: t.project_id || undefined,
          paymentMethod: t.payment_method as 'cash' | 'online',
          date: t.date,
          time: t.time,
          notes: t.notes || undefined,
          isRecurring: t.is_recurring || false,
          recurringFrequency: t.recurring_frequency as 'weekly' | 'monthly' | undefined
        }))
      },
      error: null
    };
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
    debounceTimer = setTimeout(onDataChange, 200);
  };

  const channel = supabase
    .channel(`user-data-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, debouncedCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` }, debouncedCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors', filter: `user_id=eq.${userId}` }, debouncedCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` }, debouncedCallback)
    .subscribe();

  return {
    unsubscribe: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    }
  };
};

// ============ Healing Refresh ============

const HEAL_INTERVAL_MS = 30000; // 30 seconds

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

import { supabase } from '@/integrations/supabase/client';

export type PendingOperationType = 'insert' | 'update' | 'delete';
export type PendingEntityType = 'transaction' | 'category' | 'vendor' | 'project';

export interface PendingOperation {
  id: string;
  type: PendingOperationType;
  entity: PendingEntityType;
  entityId: string;
  data: Record<string, unknown>;
  userId: string;
  timestamp: string;
  retryCount: number;
}

const STORAGE_KEY = 'fintrack_pending_operations';

// Load pending operations from localStorage
export const loadPendingOperations = (): PendingOperation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save pending operations to localStorage
export const savePendingOperations = (operations: PendingOperation[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
  } catch (error) {
    console.error('Failed to save pending operations:', error);
  }
};

// Add a pending operation
export const addPendingOperation = (operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>) => {
  const operations = loadPendingOperations();
  const newOperation: PendingOperation = {
    ...operation,
    id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };
  operations.push(newOperation);
  savePendingOperations(operations);
  return newOperation;
};

// Remove a pending operation
export const removePendingOperation = (id: string) => {
  const operations = loadPendingOperations();
  savePendingOperations(operations.filter(op => op.id !== id));
};

// Get table name from entity type
const getTableName = (entity: PendingEntityType): 'transactions' | 'categories' | 'vendors' | 'projects' => {
  switch (entity) {
    case 'transaction': return 'transactions';
    case 'category': return 'categories';
    case 'vendor': return 'vendors';
    case 'project': return 'projects';
  }
};

// Process a single pending operation
const processOperation = async (operation: PendingOperation): Promise<boolean> => {
  const { type, entity, entityId, data, userId } = operation;
  const tableName = getTableName(entity);
  
  try {
    let result;
    
    switch (type) {
      case 'insert':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (supabase.from(tableName) as any).insert({
          ...data,
          id: entityId,
          user_id: userId,
        });
        break;
        
      case 'update':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (supabase.from(tableName) as any)
          .update(data)
          .eq('id', entityId);
        break;
        
      case 'delete':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (supabase.from(tableName) as any)
          .delete()
          .eq('id', entityId);
        break;
    }
    
    if (result?.error) {
      console.error(`Failed to sync ${type} ${entity}:`, result.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing pending operation:`, error);
    return false;
  }
};

// Sync all pending operations
export const syncPendingOperations = async (): Promise<{ synced: number; failed: number }> => {
  const operations = loadPendingOperations();
  
  if (operations.length === 0) {
    return { synced: 0, failed: 0 };
  }
  
  let synced = 0;
  let failed = 0;
  const remainingOperations: PendingOperation[] = [];
  
  // Sort by timestamp to process in order
  const sortedOperations = [...operations].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  for (const operation of sortedOperations) {
    const success = await processOperation(operation);
    
    if (success) {
      synced++;
    } else {
      failed++;
      // Keep failed operations for retry, but increment retry count
      if (operation.retryCount < 3) {
        remainingOperations.push({
          ...operation,
          retryCount: operation.retryCount + 1,
        });
      }
      // After 3 retries, drop the operation
    }
  }
  
  savePendingOperations(remainingOperations);
  
  return { synced, failed };
};

// Get count of pending operations
export const getPendingOperationsCount = (): number => {
  return loadPendingOperations().length;
};

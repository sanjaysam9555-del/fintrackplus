import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, Category, Project, FinanceState, TransactionType, UserProfile, Notification, Vendor } from './types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { addToSyncQueue, getQueueSize, processSyncQueue, loadSyncQueue } from './syncEngine';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface CloudData {
  profile?: UserProfile;
  categories: Category[];
  vendors: Vendor[];
  projects: Project[];
  transactions: Transaction[];
}

interface FinanceStore extends FinanceState {
  // User Profile
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id'>, userId?: string) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>, userId?: string) => void;
  deleteTransaction: (id: string, userId?: string) => void;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id'>, userId?: string) => void;
  updateCategory: (id: string, category: Partial<Category>, userId?: string) => void;
  deleteCategory: (id: string, userId?: string) => void;
  
  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt'>, userId?: string) => void;
  updateProject: (id: string, project: Partial<Project>, userId?: string) => void;
  deleteProject: (id: string, userId?: string) => void;
  
  // Vendor actions
  vendors: Vendor[];
  addVendor: (name: string, color?: string, icon?: string, userId?: string) => void;
  updateVendor: (id: string, updates: Partial<Vendor>, userId?: string) => void;
  deleteVendor: (id: string, userId?: string) => void;
  
  // Cloud sync
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (timestamp: string) => void;
  setCloudData: (data: CloudData) => void;
  updatePendingCount: () => void;
  
  // Data management
  loadDemoData: () => void;
  clearAllData: () => void;
  
  // Computed helpers
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getCategoryById: (id: string) => Category | undefined;
  getProjectById: (id: string) => Project | undefined;
  getProjectSpending: (projectId: string) => number;
  getTotalIncome: (startDate?: string, endDate?: string) => number;
  getTotalExpense: (startDate?: string, endDate?: string) => number;
  getUniqueVendors: () => string[];
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      categories: [],
      projects: [],
      vendors: [],
      userProfile: { name: 'User' },
      notifications: [],
      syncStatus: 'idle',
      lastSyncedAt: null,
      pendingCount: 0,
      
      // Cloud sync
      setSyncStatus: (status) => set({ syncStatus: status }),
      setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
      updatePendingCount: () => set({ pendingCount: getQueueSize() }),
      
    setCloudData: (data) => {
      // CRITICAL: Merge cloud data with pending local operations to prevent data loss
      const pendingQueue = loadSyncQueue();
      
      // Get sets of entity IDs that are pending insert/update (should be preserved locally)
      const pendingInserts = new Map<string, Set<string>>();
      const pendingUpdates = new Map<string, Set<string>>();
      const pendingDeletes = new Map<string, Set<string>>();
      
      pendingQueue.forEach(op => {
        const key = op.entity;
        if (op.type === 'insert') {
          if (!pendingInserts.has(key)) pendingInserts.set(key, new Set());
          pendingInserts.get(key)!.add(op.entityId);
        } else if (op.type === 'update') {
          if (!pendingUpdates.has(key)) pendingUpdates.set(key, new Set());
          pendingUpdates.get(key)!.add(op.entityId);
        } else if (op.type === 'delete') {
          if (!pendingDeletes.has(key)) pendingDeletes.set(key, new Set());
          pendingDeletes.get(key)!.add(op.entityId);
        }
      });
      
      const currentState = get();
      
      // Helper to merge arrays: keep pending inserts from local, exclude pending deletes from cloud
      const mergeData = <T extends { id: string }>(
        cloudItems: T[],
        localItems: T[],
        entityType: string
      ): T[] => {
        const insertIds = pendingInserts.get(entityType) || new Set();
        const deleteIds = pendingDeletes.get(entityType) || new Set();
        
        // Start with cloud items, excluding ones pending delete
        const merged = cloudItems.filter(item => !deleteIds.has(item.id));
        
        // Add locally inserted items that aren't in cloud yet
        const cloudIds = new Set(cloudItems.map(c => c.id));
        localItems.forEach(localItem => {
          if (insertIds.has(localItem.id) && !cloudIds.has(localItem.id)) {
            merged.push(localItem);
          }
        });
        
        return merged;
      };
      
      set({
        transactions: mergeData(data.transactions, currentState.transactions, 'transaction'),
        categories: mergeData(data.categories, currentState.categories, 'category'),
        vendors: mergeData(data.vendors, currentState.vendors, 'vendor'),
        projects: mergeData(data.projects, currentState.projects, 'project'),
        userProfile: data.profile || currentState.userProfile || { name: 'User' },
      });
    },
      
      // User Profile
      updateUserProfile: async (profile) => {
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile }
        }));
        
        // Sync to cloud
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ 
              name: profile.name, 
              avatar_url: profile.avatar 
            })
            .eq('user_id', user.id);
        }
        
        get().addNotification({
          type: 'profile',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully',
        });
      },
      
      // Notifications
      addNotification: (notification) => set((state) => ({
        notifications: [{
          ...notification,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          read: false,
        }, ...state.notifications].slice(0, 50)
      })),
      
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      })),
      
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      })),
      
      // Transaction actions - Optimistic local-first with background sync
      addTransaction: async (transaction, userId) => {
        const id = uuidv4();
        
        const transactionData = {
          type: transaction.type,
          amount: transaction.amount,
          title: transaction.title || null,
          vendor: transaction.vendor,
          category_id: transaction.categoryId || null,
          project_id: transaction.projectId || null,
          payment_method: transaction.paymentMethod,
          date: transaction.date,
          time: transaction.time,
          notes: transaction.notes || null,
          is_recurring: transaction.isRecurring || false,
          recurring_frequency: transaction.recurringFrequency || null,
        };
        
        // 1. Add to local state immediately (optimistic)
        set((state) => ({
          transactions: [{ ...transaction, id }, ...state.transactions]
        }));
        
        // 2. Queue for sync (handles online/offline automatically)
        if (userId) {
          addToSyncQueue({
            type: 'insert',
            entity: 'transaction',
            entityId: id,
            data: transactionData,
            userId,
          });
          get().updatePendingCount();
          
          // 3. Try to sync immediately if online (silently)
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'transaction',
          title: `${transaction.type === 'income' ? 'Income' : 'Expense'} Added`,
          message: `${transaction.vendor} - ₹${transaction.amount.toLocaleString()}`,
        });
      },
      
      updateTransaction: async (id, updates, userId) => {
        const transaction = get().transactions.find(t => t.id === id);
        
        // 1. Update local state immediately (optimistic)
        set((state) => ({
          transactions: state.transactions.map((t) => 
            t.id === id ? { ...t, ...updates } : t
          )
        }));
        
        // 2. Queue for sync
        if (userId) {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.type) dbUpdates.type = updates.type;
          if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
          if (updates.title !== undefined) dbUpdates.title = updates.title || null;
          if (updates.vendor) dbUpdates.vendor = updates.vendor;
          if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId || null;
          if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId || null;
          if (updates.paymentMethod) dbUpdates.payment_method = updates.paymentMethod;
          if (updates.date) dbUpdates.date = updates.date;
          if (updates.time) dbUpdates.time = updates.time;
          if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
          
          addToSyncQueue({
            type: 'update',
            entity: 'transaction',
            entityId: id,
            data: dbUpdates,
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }

        if (transaction) {
          get().addNotification({
            type: 'edit',
            title: 'Transaction Updated',
            message: `${transaction.vendor} - ₹${transaction.amount.toLocaleString()}`,
          });
        }
      },
      
      deleteTransaction: async (id, userId) => {
        const transaction = get().transactions.find(t => t.id === id);
        
        // 1. Remove from local state immediately (optimistic)
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id)
        }));
        
        // 2. Queue for sync
        if (userId) {
          addToSyncQueue({
            type: 'delete',
            entity: 'transaction',
            entityId: id,
            data: {},
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        if (transaction) {
          get().addNotification({
            type: 'delete',
            title: 'Transaction Deleted',
            message: `${transaction.vendor} - ₹${transaction.amount.toLocaleString()}`,
          });
        }
      },
      
      // Category actions - Optimistic local-first with background sync
      addCategory: async (category, userId) => {
        const id = uuidv4();
        
        set((state) => ({
          categories: [...state.categories, { ...category, id }]
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'insert',
            entity: 'category',
            entityId: id,
            data: {
              name: category.name,
              icon: category.icon,
              color: category.color,
              type: category.type,
            },
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'category',
          title: 'Category Added',
          message: category.name,
        });
      },
      
      updateCategory: async (id, updates, userId) => {
        set((state) => ({
          categories: state.categories.map((c) => 
            c.id === id ? { ...c, ...updates } : c
          )
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'update',
            entity: 'category',
            entityId: id,
            data: updates,
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'edit',
          title: 'Category Updated',
          message: updates.name || 'Category modified',
        });
      },
      
      deleteCategory: async (id, userId) => {
        const category = get().categories.find(c => c.id === id);
        
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id)
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'delete',
            entity: 'category',
            entityId: id,
            data: {},
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        if (category) {
          get().addNotification({
            type: 'delete',
            title: 'Category Deleted',
            message: category.name,
          });
        }
      },
      
      // Project actions - Optimistic local-first with background sync
      addProject: async (project, userId) => {
        const id = uuidv4();
        const createdAt = new Date().toISOString().split('T')[0];
        
        set((state) => ({
          projects: [...state.projects, { ...project, id, createdAt }]
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'insert',
            entity: 'project',
            entityId: id,
            data: {
              name: project.name,
              description: project.description || null,
              budget_limit: project.budgetLimit,
              color: project.color,
            },
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'project',
          title: 'Project Added',
          message: project.name,
        });
      },
      
      updateProject: async (id, updates, userId) => {
        set((state) => ({
          projects: state.projects.map((p) => 
            p.id === id ? { ...p, ...updates } : p
          )
        }));
        
        if (userId) {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.name) dbUpdates.name = updates.name;
          if (updates.description !== undefined) dbUpdates.description = updates.description;
          if (updates.budgetLimit !== undefined) dbUpdates.budget_limit = updates.budgetLimit;
          if (updates.color) dbUpdates.color = updates.color;
          
          addToSyncQueue({
            type: 'update',
            entity: 'project',
            entityId: id,
            data: dbUpdates,
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'edit',
          title: 'Project Updated',
          message: updates.name || 'Project modified',
        });
      },
      
      deleteProject: async (id, userId) => {
        const project = get().projects.find(p => p.id === id);
        
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id)
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'delete',
            entity: 'project',
            entityId: id,
            data: {},
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        if (project) {
          get().addNotification({
            type: 'delete',
            title: 'Project Deleted',
            message: project.name,
          });
        }
      },
      
      // Vendor actions - Optimistic local-first with background sync
      addVendor: async (name, color, icon, userId) => {
        const id = uuidv4();
        
        set((state) => ({
          vendors: [...state.vendors, { id, name, color, icon }]
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'insert',
            entity: 'vendor',
            entityId: id,
            data: {
              name,
              icon: icon || null,
              color: color || null,
            },
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'vendor',
          title: 'Vendor Added',
          message: name,
        });
      },
      
      updateVendor: async (id, updates, userId) => {
        set((state) => ({
          vendors: state.vendors.map((v) => 
            v.id === id ? { ...v, ...updates } : v
          )
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'update',
            entity: 'vendor',
            entityId: id,
            data: updates,
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        const vendor = get().vendors.find(v => v.id === id);
        get().addNotification({
          type: 'edit',
          title: 'Vendor Updated',
          message: updates.name || vendor?.name || 'Vendor modified',
        });
      },
      
      deleteVendor: async (id, userId) => {
        const vendor = get().vendors.find(v => v.id === id);
        
        set((state) => ({
          vendors: state.vendors.filter((v) => v.id !== id)
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'delete',
            entity: 'vendor',
            entityId: id,
            data: {},
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        if (vendor) {
          get().addNotification({
            type: 'delete',
            title: 'Vendor Deleted',
            message: vendor.name,
          });
        }
      },
      
      // Data management
      loadDemoData: () => {
        set({
          transactions: [],
          categories: [],
          projects: [],
          vendors: [],
        });
      },
      
      clearAllData: () => set({
        transactions: [],
        categories: [],
        projects: [],
        vendors: [],
      }),
      
      // Computed helpers
      getTransactionsByType: (type) => 
        get().transactions.filter((t) => t.type === type),
      
      getTransactionsByDateRange: (startDate, endDate) => 
        get().transactions.filter((t) => t.date >= startDate && t.date <= endDate),
      
      getCategoryById: (id) => 
        get().categories.find((c) => c.id === id),
      
      getProjectById: (id) => 
        get().projects.find((p) => p.id === id),
      
      getProjectSpending: (projectId) => 
        get().transactions
          .filter((t) => t.projectId === projectId && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
      
      getTotalIncome: (startDate, endDate) => {
        let transactions = get().transactions.filter((t) => t.type === 'income');
        if (startDate && endDate) {
          transactions = transactions.filter((t) => t.date >= startDate && t.date <= endDate);
        }
        return transactions.reduce((sum, t) => sum + t.amount, 0);
      },
      
      getTotalExpense: (startDate, endDate) => {
        let transactions = get().transactions.filter((t) => t.type === 'expense');
        if (startDate && endDate) {
          transactions = transactions.filter((t) => t.date >= startDate && t.date <= endDate);
        }
        return transactions.reduce((sum, t) => sum + t.amount, 0);
      },
      
      getUniqueVendors: () => {
        const vendors = new Set(get().transactions.map(t => t.vendor));
        return Array.from(vendors);
      },
    }),
    {
      name: 'fintrack-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        categories: state.categories,
        projects: state.projects,
        vendors: state.vendors,
        userProfile: state.userProfile,
        notifications: state.notifications,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
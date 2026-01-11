import { create } from 'zustand';
import { Transaction, Category, Project, FinanceState, TransactionType, UserProfile, Notification, Vendor } from './types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

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
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (timestamp: string) => void;
  setCloudData: (data: CloudData) => void;
  
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
  (set, get) => ({
    transactions: [],
    categories: [],
    projects: [],
    vendors: [],
    userProfile: { name: 'User' },
    notifications: [],
    syncStatus: 'idle',
    lastSyncedAt: null,
      
      // Cloud sync
      setSyncStatus: (status) => set({ syncStatus: status }),
      setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
      
    setCloudData: (data) => {
      set({
        transactions: data.transactions,
        categories: data.categories,
        vendors: data.vendors,
        projects: data.projects,
        userProfile: data.profile || { name: 'User' },
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
      
      // Transaction actions
      addTransaction: async (transaction, userId) => {
        const id = uuidv4();
        
        // Sync to cloud if user is logged in - do this FIRST
        if (userId) {
          const { error } = await supabase.from('transactions').insert({
            id,
            user_id: userId,
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
          });
          
          if (error) {
            console.error('Error saving transaction to cloud:', error);
            // Still add to local state but notify about sync failure
          }
        }
        
        // Add to local state
        set((state) => ({
          transactions: [{ ...transaction, id }, ...state.transactions]
        }));
        
        get().addNotification({
          type: 'transaction',
          title: `${transaction.type === 'income' ? 'Income' : 'Expense'} Added`,
          message: `${transaction.vendor} - ₹${transaction.amount.toLocaleString()}`,
        });
      },
      
      updateTransaction: async (id, updates, userId) => {
        const transaction = get().transactions.find(t => t.id === id);
        set((state) => ({
          transactions: state.transactions.map((t) => 
            t.id === id ? { ...t, ...updates } : t
          )
        }));
        
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
          
          await supabase.from('transactions').update(dbUpdates).eq('id', id);
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
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id)
        }));
        
        if (userId) {
          await supabase.from('transactions').delete().eq('id', id);
        }
        
        if (transaction) {
          get().addNotification({
            type: 'delete',
            title: 'Transaction Deleted',
            message: `${transaction.vendor} - ₹${transaction.amount.toLocaleString()}`,
          });
        }
      },
      
      // Category actions
      addCategory: async (category, userId) => {
        const id = uuidv4();
        set((state) => ({
          categories: [...state.categories, { ...category, id }]
        }));
        
        if (userId) {
          await supabase.from('categories').insert({
            id,
            user_id: userId,
            name: category.name,
            icon: category.icon,
            color: category.color,
            type: category.type,
          });
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
          await supabase.from('categories').update(updates).eq('id', id);
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
          await supabase.from('categories').delete().eq('id', id);
        }
        
        if (category) {
          get().addNotification({
            type: 'delete',
            title: 'Category Deleted',
            message: category.name,
          });
        }
      },
      
      // Project actions
      addProject: async (project, userId) => {
        const id = uuidv4();
        const createdAt = new Date().toISOString().split('T')[0];
        set((state) => ({
          projects: [...state.projects, { ...project, id, createdAt }]
        }));
        
        if (userId) {
          await supabase.from('projects').insert({
            id,
            user_id: userId,
            name: project.name,
            description: project.description || null,
            budget_limit: project.budgetLimit,
            color: project.color,
          });
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
          
          await supabase.from('projects').update(dbUpdates).eq('id', id);
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
          await supabase.from('projects').delete().eq('id', id);
        }
        
        if (project) {
          get().addNotification({
            type: 'delete',
            title: 'Project Deleted',
            message: project.name,
          });
        }
      },
      
      // Vendor actions
      addVendor: async (name, color, icon, userId) => {
        const id = uuidv4();
        set((state) => ({
          vendors: [...state.vendors, { id, name, color, icon }]
        }));
        
        if (userId) {
          await supabase.from('vendors').insert({
            id,
            user_id: userId,
            name,
            icon: icon || null,
            color: color || null,
          });
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
          await supabase.from('vendors').update(updates).eq('id', id);
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
          await supabase.from('vendors').delete().eq('id', id);
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
    })
);
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, Category, Project, FinanceState, TransactionType, UserProfile, Notification, Vendor } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_PROJECTS, DEMO_TRANSACTIONS } from './constants';
import { v4 as uuidv4 } from 'uuid';

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
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Vendor actions
  vendors: Vendor[];
  addVendor: (name: string) => void;
  updateVendor: (id: string, name: string) => void;
  deleteVendor: (id: string) => void;
  
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
      categories: DEFAULT_CATEGORIES,
      projects: [],
      vendors: [],
      userProfile: { name: 'Swati Sharma' },
      notifications: [],
      
      // User Profile
      updateUserProfile: (profile) => {
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile }
        }));
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
        }, ...state.notifications].slice(0, 50) // Keep last 50 notifications
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
      addTransaction: (transaction) => {
        set((state) => ({
          transactions: [{ ...transaction, id: uuidv4() }, ...state.transactions]
        }));
        get().addNotification({
          type: 'transaction',
          title: `${transaction.type === 'income' ? 'Income' : 'Expense'} Added`,
          message: `${transaction.vendor} - ₹${transaction.amount.toLocaleString()}`,
        });
      },
      
      updateTransaction: (id, updates) => {
        const transaction = get().transactions.find(t => t.id === id);
        set((state) => ({
          transactions: state.transactions.map((t) => 
            t.id === id ? { ...t, ...updates } : t
          )
        }));
        if (transaction) {
          get().addNotification({
            type: 'edit',
            title: 'Transaction Updated',
            message: `${transaction.vendor} - ₹${transaction.amount.toLocaleString()}`,
          });
        }
      },
      
      deleteTransaction: (id) => {
        const transaction = get().transactions.find(t => t.id === id);
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id)
        }));
        if (transaction) {
          get().addNotification({
            type: 'delete',
            title: 'Transaction Deleted',
            message: `${transaction.vendor} - ₹${transaction.amount.toLocaleString()}`,
          });
        }
      },
      
      // Category actions
      addCategory: (category) => {
        set((state) => ({
          categories: [...state.categories, { ...category, id: uuidv4() }]
        }));
        get().addNotification({
          type: 'category',
          title: 'Category Added',
          message: category.name,
        });
      },
      
      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) => 
            c.id === id ? { ...c, ...updates } : c
          )
        }));
        get().addNotification({
          type: 'edit',
          title: 'Category Updated',
          message: updates.name || 'Category modified',
        });
      },
      
      deleteCategory: (id) => {
        const category = get().categories.find(c => c.id === id);
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id)
        }));
        if (category) {
          get().addNotification({
            type: 'delete',
            title: 'Category Deleted',
            message: category.name,
          });
        }
      },
      
      // Project actions
      addProject: (project) => {
        set((state) => ({
          projects: [...state.projects, { 
            ...project, 
            id: uuidv4(),
            createdAt: new Date().toISOString().split('T')[0]
          }]
        }));
        get().addNotification({
          type: 'project',
          title: 'Project Added',
          message: project.name,
        });
      },
      
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => 
            p.id === id ? { ...p, ...updates } : p
          )
        }));
        get().addNotification({
          type: 'edit',
          title: 'Project Updated',
          message: updates.name || 'Project modified',
        });
      },
      
      deleteProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id)
        }));
        if (project) {
          get().addNotification({
            type: 'delete',
            title: 'Project Deleted',
            message: project.name,
          });
        }
      },
      
      // Vendor actions
      addVendor: (name) => {
        set((state) => ({
          vendors: [...state.vendors, { id: uuidv4(), name }]
        }));
        get().addNotification({
          type: 'vendor',
          title: 'Vendor Added',
          message: name,
        });
      },
      
      updateVendor: (id, name) => {
        set((state) => ({
          vendors: state.vendors.map((v) => 
            v.id === id ? { ...v, name } : v
          )
        }));
        get().addNotification({
          type: 'edit',
          title: 'Vendor Updated',
          message: name,
        });
      },
      
      deleteVendor: (id) => {
        const vendor = get().vendors.find(v => v.id === id);
        set((state) => ({
          vendors: state.vendors.filter((v) => v.id !== id)
        }));
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
        const uniqueVendors = Array.from(new Set(DEMO_TRANSACTIONS.map(t => t.vendor)));
        set({
          transactions: DEMO_TRANSACTIONS,
          categories: DEFAULT_CATEGORIES,
          projects: DEFAULT_PROJECTS,
          vendors: uniqueVendors.map(name => ({ id: uuidv4(), name })),
        });
      },
      
      clearAllData: () => set({
        transactions: [],
        categories: DEFAULT_CATEGORIES,
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
    }
  )
);

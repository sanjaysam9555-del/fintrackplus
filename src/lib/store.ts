import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, Category, Project, FinanceState, TransactionType } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_PROJECTS, DEMO_TRANSACTIONS } from './constants';
import { v4 as uuidv4 } from 'uuid';

interface FinanceStore extends FinanceState {
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
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      projects: [],
      
      // Transaction actions
      addTransaction: (transaction) => set((state) => ({
        transactions: [{ ...transaction, id: uuidv4() }, ...state.transactions]
      })),
      
      updateTransaction: (id, updates) => set((state) => ({
        transactions: state.transactions.map((t) => 
          t.id === id ? { ...t, ...updates } : t
        )
      })),
      
      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id)
      })),
      
      // Category actions
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, { ...category, id: uuidv4() }]
      })),
      
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map((c) => 
          c.id === id ? { ...c, ...updates } : c
        )
      })),
      
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id)
      })),
      
      // Project actions
      addProject: (project) => set((state) => ({
        projects: [...state.projects, { 
          ...project, 
          id: uuidv4(),
          createdAt: new Date().toISOString().split('T')[0]
        }]
      })),
      
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === id ? { ...p, ...updates } : p
        )
      })),
      
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id)
      })),
      
      // Data management
      loadDemoData: () => set({
        transactions: DEMO_TRANSACTIONS,
        categories: DEFAULT_CATEGORIES,
        projects: DEFAULT_PROJECTS,
      }),
      
      clearAllData: () => set({
        transactions: [],
        categories: DEFAULT_CATEGORIES,
        projects: [],
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
    }),
    {
      name: 'fintrack-storage',
    }
  )
);

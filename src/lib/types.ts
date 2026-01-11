export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'online';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  budgetLimit: number;
  color: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  vendor: string;
  categoryId: string;
  projectId?: string;
  paymentMethod: PaymentMethod;
  date: string;
  time: string;
  notes?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly';
}

export interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  projects: Project[];
}

export interface ChartDataPoint {
  name: string;
  income: number;
  expense: number;
  date: string;
}

export interface InsightData {
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export interface UserProfile {
  name: string;
  avatar?: string;
}

export interface Vendor {
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  type: 'transaction' | 'export' | 'profile';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

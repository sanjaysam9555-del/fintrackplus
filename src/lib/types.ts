export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'online';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface ProjectLabel {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  internalCost: number;   // mapped to DB budget_limit
  clientCost: number;     // mapped to DB margin column
  expectedMargin: number; // mapped to DB expected_margin column
  color: string;
  archived?: boolean;
  labelIds?: string[];
  assignedEmployeeIds?: string[];
  eventDate?: string;
  startDate?: string;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  color: string;
  initialCashBalance: number;
  initialOnlineBalance: number;
  avatarUrl?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  title?: string;
  vendor: string;
  categoryId: string;
  projectId?: string;
  partnerId?: string;
  paymentMethod: PaymentMethod;
  date: string;
  time: string;
  notes?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  receiptUrl?: string;
  isGst?: boolean;
  // Part payment / Installment tracking
  isPartPayment?: boolean;
  totalExpectedAmount?: number;
  linkedTransactionId?: string;
  plannedInstallments?: PlannedInstallment[];
  createdAt?: string;
}

export interface PlannedInstallment {
  id: string;
  amount: number;
  expectedDate?: string;
  status: 'pending' | 'received';
  receivedDate?: string;
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
  icon?: string;
  color?: string;
}

export interface NotificationChange {
  field: string;
  from: string;
  to: string;
}

export interface Notification {
  id: string;
  type: 'transaction' | 'export' | 'profile' | 'category' | 'vendor' | 'project' | 'delete' | 'edit' | 'partner' | 'label' | 'settings';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  details?: NotificationChange[];
  entityType?: string;
  entityId?: string;
}

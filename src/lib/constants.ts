import { Category, Project, Transaction } from './types';
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: 'category-food', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: 'Car', color: 'category-transport', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: 'category-shopping', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Film', color: 'category-entertainment', type: 'expense' },
  { id: 'utilities', name: 'Utilities', icon: 'Zap', color: 'category-utilities', type: 'expense' },
  { id: 'health', name: 'Health', icon: 'Heart', color: 'category-health', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: 'Plane', color: 'category-travel', type: 'expense' },
  { id: 'groceries', name: 'Groceries', icon: 'ShoppingCart', color: 'category-groceries', type: 'expense' },
  { id: 'electronics', name: 'Electronics', icon: 'Smartphone', color: 'category-electronics', type: 'expense' },
  { id: 'software', name: 'Software', icon: 'Code', color: 'category-software', type: 'expense' },
  { id: 'other-expense', name: 'Other', icon: 'MoreHorizontal', color: 'category-other', type: 'expense' },
  
  // Income categories
  { id: 'salary', name: 'Salary', icon: 'Wallet', color: 'category-salary', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'Briefcase', color: 'category-freelance', type: 'income' },
  { id: 'investment', name: 'Investment', icon: 'TrendingUp', color: 'category-investment', type: 'income' },
  { id: 'services', name: 'Services', icon: 'Wrench', color: 'category-services', type: 'income' },
  { id: 'other-income', name: 'Other', icon: 'MoreHorizontal', color: 'category-other', type: 'income' },
];

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'home-renovation',
    name: 'Home Renovation',
    description: 'Kitchen and bathroom remodel',
    budgetLimit: 150000,
    color: 'bg-emerald-500',
    createdAt: '2024-01-01',
  },
  {
    id: 'vacation',
    name: 'Family Vacation',
    description: 'Summer trip to Europe',
    budgetLimit: 80000,
    color: 'bg-blue-500',
    createdAt: '2024-01-15',
  },
  {
    id: 'wedding',
    name: 'Wedding',
    description: 'Wedding preparations and venue',
    budgetLimit: 500000,
    color: 'bg-pink-500',
    createdAt: '2024-02-01',
  },
];

const today = new Date();
const getDateString = (daysAgo: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const getTimeString = (hour: number, minute: number) => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

export const DEMO_TRANSACTIONS: Transaction[] = [
  // Today
  { id: uuidv4(), type: 'expense', amount: 450, vendor: 'Starbucks', categoryId: 'food', paymentMethod: 'online', date: getDateString(0), time: getTimeString(10, 42), notes: 'Morning coffee' },
  { id: uuidv4(), type: 'expense', amount: 1200, vendor: 'Uber', categoryId: 'transport', paymentMethod: 'online', date: getDateString(0), time: getTimeString(8, 15) },
  { id: uuidv4(), type: 'income', amount: 25000, vendor: 'Client Payment', categoryId: 'freelance', paymentMethod: 'online', date: getDateString(0), time: getTimeString(14, 30), notes: 'Website project' },
  
  // Yesterday
  { id: uuidv4(), type: 'expense', amount: 2999, vendor: 'Apple Store', categoryId: 'electronics', paymentMethod: 'online', date: getDateString(1), time: getTimeString(16, 30), projectId: 'home-renovation' },
  { id: uuidv4(), type: 'expense', amount: 3520, vendor: 'Whole Foods', categoryId: 'groceries', paymentMethod: 'cash', date: getDateString(1), time: getTimeString(12, 15) },
  { id: uuidv4(), type: 'expense', amount: 4999, vendor: 'Netflix + Spotify', categoryId: 'software', paymentMethod: 'online', date: getDateString(1), time: getTimeString(9, 0), isRecurring: true, recurringFrequency: 'monthly' },
  
  // 2 days ago
  { id: uuidv4(), type: 'income', amount: 85000, vendor: 'Salary Deposit', categoryId: 'salary', paymentMethod: 'online', date: getDateString(2), time: getTimeString(9, 0) },
  { id: uuidv4(), type: 'expense', amount: 15000, vendor: 'Zara', categoryId: 'shopping', paymentMethod: 'online', date: getDateString(2), time: getTimeString(15, 45) },
  
  // 3 days ago
  { id: uuidv4(), type: 'expense', amount: 8500, vendor: 'Restaurant XYZ', categoryId: 'food', paymentMethod: 'cash', date: getDateString(3), time: getTimeString(20, 30) },
  { id: uuidv4(), type: 'expense', amount: 2500, vendor: 'Electricity Bill', categoryId: 'utilities', paymentMethod: 'online', date: getDateString(3), time: getTimeString(11, 0), isRecurring: true, recurringFrequency: 'monthly' },
  
  // 5 days ago
  { id: uuidv4(), type: 'expense', amount: 45000, vendor: 'Flight Booking', categoryId: 'travel', paymentMethod: 'online', date: getDateString(5), time: getTimeString(14, 0), projectId: 'vacation' },
  { id: uuidv4(), type: 'income', amount: 12000, vendor: 'Dividend', categoryId: 'investment', paymentMethod: 'online', date: getDateString(5), time: getTimeString(10, 0) },
  
  // Week ago
  { id: uuidv4(), type: 'expense', amount: 25000, vendor: 'Home Depot', categoryId: 'shopping', paymentMethod: 'online', date: getDateString(7), time: getTimeString(11, 30), projectId: 'home-renovation' },
  { id: uuidv4(), type: 'expense', amount: 1500, vendor: 'Gym Membership', categoryId: 'health', paymentMethod: 'online', date: getDateString(7), time: getTimeString(8, 0), isRecurring: true, recurringFrequency: 'monthly' },
  
  // 10 days ago
  { id: uuidv4(), type: 'income', amount: 35000, vendor: 'Consulting Fee', categoryId: 'services', paymentMethod: 'online', date: getDateString(10), time: getTimeString(16, 0) },
  { id: uuidv4(), type: 'expense', amount: 6500, vendor: 'Movies & Dinner', categoryId: 'entertainment', paymentMethod: 'cash', date: getDateString(10), time: getTimeString(19, 30) },
  
  // 2 weeks ago
  { id: uuidv4(), type: 'expense', amount: 18000, vendor: 'Kitchen Tiles', categoryId: 'shopping', paymentMethod: 'online', date: getDateString(14), time: getTimeString(10, 0), projectId: 'home-renovation' },
  { id: uuidv4(), type: 'income', amount: 85000, vendor: 'Salary Deposit', categoryId: 'salary', paymentMethod: 'online', date: getDateString(15), time: getTimeString(9, 0) },
  
  // 3 weeks ago
  { id: uuidv4(), type: 'expense', amount: 12000, vendor: 'Doctor Visit', categoryId: 'health', paymentMethod: 'cash', date: getDateString(21), time: getTimeString(11, 0) },
  { id: uuidv4(), type: 'expense', amount: 8000, vendor: 'Hotel Booking', categoryId: 'travel', paymentMethod: 'online', date: getDateString(21), time: getTimeString(15, 0), projectId: 'vacation' },
  
  // Month ago
  { id: uuidv4(), type: 'income', amount: 85000, vendor: 'Salary Deposit', categoryId: 'salary', paymentMethod: 'online', date: getDateString(30), time: getTimeString(9, 0) },
  { id: uuidv4(), type: 'expense', amount: 55000, vendor: 'Wedding Venue Deposit', categoryId: 'other-expense', paymentMethod: 'online', date: getDateString(30), time: getTimeString(14, 0), projectId: 'wedding' },
];

export const CURRENCY_SYMBOL = '₹';

export const formatCurrency = (amount: number, showSymbol = true): string => {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
  
  return showSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateString === today.toISOString().split('T')[0]) {
    return 'Today';
  } else if (dateString === yesterday.toISOString().split('T')[0]) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-IN', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
};

export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

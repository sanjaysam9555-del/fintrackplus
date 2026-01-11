import { Category } from './types';

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

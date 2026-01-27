import { Repeat } from 'lucide-react';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { formatCurrency } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { TransactionType } from '@/lib/types';

interface UpcomingRecurringBannerProps {
  type: TransactionType;
}

export const UpcomingRecurringBanner = ({ type }: UpcomingRecurringBannerProps) => {
  const { upcomingExpenses, upcomingIncome, upcomingExpenseTotal, upcomingIncomeTotal } = useRecurringTransactions();

  const items = type === 'expense' ? upcomingExpenses : upcomingIncome;
  const total = type === 'expense' ? upcomingExpenseTotal : upcomingIncomeTotal;

  if (items.length === 0) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
      type === 'expense' ? "bg-destructive/5" : "bg-success/5"
    )}>
      <Repeat size={14} className={cn(
        type === 'expense' ? "text-destructive" : "text-success"
      )} />
      <span className="text-muted-foreground">
        {items.length} upcoming
      </span>
      <span className="text-muted-foreground">•</span>
      <span className={cn(
        "font-medium",
        type === 'expense' ? "text-destructive" : "text-success"
      )}>
        {formatCurrency(total)} {type === 'expense' ? 'due' : 'expected'}
      </span>
    </div>
  );
};

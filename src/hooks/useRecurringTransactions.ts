import { useMemo } from 'react';
import { useFinanceStore } from '@/lib/store';
import { Transaction } from '@/lib/types';
import { format, addDays, addWeeks, addMonths, addYears, parseISO, isBefore, isEqual } from 'date-fns';

export interface UpcomingRecurring {
  baseTransaction: Transaction;
  nextDate: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  daysUntil: number;
}

/**
 * Hook for managing recurring transactions
 * Calculates next occurrences and generates upcoming payments
 */
export const useRecurringTransactions = () => {
  const { transactions } = useFinanceStore();

  // Get all recurring transactions
  const recurringTransactions = useMemo(() => {
    return transactions.filter(t => t.isRecurring && t.recurringFrequency);
  }, [transactions]);

  // Calculate next occurrence for a recurring transaction
  const getNextOccurrence = (transaction: Transaction): string | null => {
    if (!transaction.isRecurring || !transaction.recurringFrequency) return null;

    const baseDate = parseISO(transaction.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextDate = baseDate;

    // Find the next occurrence after today
    while (isBefore(nextDate, today) || isEqual(nextDate, baseDate)) {
      switch (transaction.recurringFrequency) {
        case 'daily':
          nextDate = addDays(nextDate, 1);
          break;
        case 'weekly':
          nextDate = addWeeks(nextDate, 1);
          break;
        case 'monthly':
          nextDate = addMonths(nextDate, 1);
          break;
        case 'yearly':
          nextDate = addYears(nextDate, 1);
          break;
      }
    }

    return format(nextDate, 'yyyy-MM-dd');
  };

  // Get upcoming recurring payments (next 30 days)
  const upcomingRecurring = useMemo((): UpcomingRecurring[] => {
    const upcoming: UpcomingRecurring[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = addDays(today, 30);

    recurringTransactions.forEach(t => {
      const nextDateStr = getNextOccurrence(t);
      if (!nextDateStr) return;

      const nextDate = parseISO(nextDateStr);
      if (isBefore(nextDate, thirtyDaysFromNow)) {
        const daysUntil = Math.ceil(
          (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        upcoming.push({
          baseTransaction: t,
          nextDate: nextDateStr,
          frequency: t.recurringFrequency!,
          daysUntil,
        });
      }
    });

    // Sort by next date
    return upcoming.sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  }, [recurringTransactions]);

  // Filter by type for respective pages
  const upcomingExpenses = useMemo(() => {
    return upcomingRecurring.filter(r => r.baseTransaction.type === 'expense');
  }, [upcomingRecurring]);

  const upcomingIncome = useMemo(() => {
    return upcomingRecurring.filter(r => r.baseTransaction.type === 'income');
  }, [upcomingRecurring]);

  // Get total upcoming recurring expenses
  const upcomingExpenseTotal = useMemo(() => {
    return upcomingExpenses.reduce((sum, r) => sum + r.baseTransaction.amount, 0);
  }, [upcomingExpenses]);

  // Get total upcoming recurring income
  const upcomingIncomeTotal = useMemo(() => {
    return upcomingIncome.reduce((sum, r) => sum + r.baseTransaction.amount, 0);
  }, [upcomingIncome]);

  return {
    recurringTransactions,
    upcomingRecurring,
    upcomingExpenses,
    upcomingIncome,
    upcomingExpenseTotal,
    upcomingIncomeTotal,
    getNextOccurrence,
  };
};

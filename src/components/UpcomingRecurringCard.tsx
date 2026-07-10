import { motion } from 'framer-motion';
import { Repeat, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { useFinanceStore } from '@/lib/store';
import { formatCurrency } from '@/lib/constants';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { findPartnerByHandledBy } from '@/lib/partnerIdentity';

interface UpcomingRecurringCardProps {
  onViewAll?: () => void;
}

export const UpcomingRecurringCard = ({ onViewAll }: UpcomingRecurringCardProps) => {
  const { upcomingRecurring, upcomingExpenseTotal, upcomingIncomeTotal } = useRecurringTransactions();
  const { partners } = useFinanceStore();

  if (upcomingRecurring.length === 0) return null;

  const displayItems = upcomingRecurring.slice(0, 3);

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return freq;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Repeat size={16} className="text-accent-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Upcoming Payments</h3>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Expected</p>
          <p className={cn(
            "text-sm font-semibold",
            upcomingIncomeTotal > upcomingExpenseTotal ? "text-success" : "text-destructive"
          )}>
            {formatCurrency(Math.abs(upcomingIncomeTotal - upcomingExpenseTotal))}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {displayItems.map((item) => {
          const partner = findPartnerByHandledBy(partners, item.baseTransaction.handledBy);
          return (
            <div
              key={`${item.baseTransaction.id}-${item.nextDate}`}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                item.baseTransaction.type === 'expense' 
                  ? "bg-destructive/10" 
                  : "bg-success/10"
              )}>
                {item.baseTransaction.type === 'expense' ? (
                  <ArrowUpRight size={14} className="text-destructive" />
                ) : (
                  <ArrowDownLeft size={14} className="text-success" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.baseTransaction.title || item.baseTransaction.vendor}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {format(parseISO(item.nextDate), 'MMM d')}
                  </span>
                  <span>•</span>
                  <span>{getFrequencyLabel(item.frequency)}</span>
                  {partner && (
                    <>
                      <span>•</span>
                      <span 
                        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] font-bold text-white"
                        style={{ backgroundColor: partner.color }}
                        title={partner.name}
                      >
                        {partner.name.charAt(0).toUpperCase()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <p className={cn(
                  "text-sm font-semibold",
                  item.baseTransaction.type === 'expense' ? "text-destructive" : "text-success"
                )}>
                  {item.baseTransaction.type === 'expense' ? '-' : '+'}
                  {formatCurrency(item.baseTransaction.amount)}
                </p>
                {item.daysUntil <= 3 && (
                  <span className="text-[10px] text-warning font-medium">
                    {item.daysUntil === 0 ? 'Today' : 
                     item.daysUntil === 1 ? 'Tomorrow' : 
                     `In ${item.daysUntil} days`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {upcomingRecurring.length > 3 && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 text-xs text-primary font-medium hover:underline"
        >
          View all {upcomingRecurring.length} upcoming payments
        </button>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
        <div className="text-center p-2 rounded-lg bg-destructive/5">
          <p className="text-[10px] text-muted-foreground">Expenses</p>
          <p className="text-sm font-semibold text-destructive">
            {formatCurrency(upcomingExpenseTotal)}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-success/5">
          <p className="text-[10px] text-muted-foreground">Income</p>
          <p className="text-sm font-semibold text-success">
            {formatCurrency(upcomingIncomeTotal)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

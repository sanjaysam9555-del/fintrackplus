import { useState } from 'react';
import { Repeat, Calendar, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { useRecurringTransactions, UpcomingRecurring } from '@/hooks/useRecurringTransactions';
import { useFinanceStore } from '@/lib/store';
import { formatCurrency } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { TransactionType } from '@/lib/types';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { format, parseISO } from 'date-fns';

interface UpcomingRecurringBannerProps {
  type: TransactionType;
}

const getFrequencyLabel = (freq: string) => {
  switch (freq) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'yearly': return 'Yearly';
    default: return freq;
  }
};

export const UpcomingRecurringBanner = ({ type }: UpcomingRecurringBannerProps) => {
  const { upcomingExpenses, upcomingIncome, upcomingExpenseTotal, upcomingIncomeTotal } = useRecurringTransactions();
  const { partners, categories } = useFinanceStore();
  const [isOpen, setIsOpen] = useState(false);

  const items = type === 'expense' ? upcomingExpenses : upcomingIncome;
  const total = type === 'expense' ? upcomingExpenseTotal : upcomingIncomeTotal;

  if (items.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          type === 'expense' 
            ? "bg-destructive/5 hover:bg-destructive/10" 
            : "bg-success/5 hover:bg-success/10"
        )}
      >
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
        <ChevronRight size={14} className="ml-auto text-muted-foreground" />
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl" aria-describedby={undefined}>
          <div className="pb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Repeat size={18} className={cn(
                type === 'expense' ? "text-destructive" : "text-success"
              )} />
              Upcoming {type === 'expense' ? 'Expenses' : 'Income'}
            </h2>
          </div>

          {/* Summary */}
          <div className={cn(
            "p-3 rounded-lg mb-4",
            type === 'expense' ? "bg-destructive/5" : "bg-success/5"
          )}>
            <p className="text-xs text-muted-foreground">Total due in next 30 days</p>
            <p className={cn(
              "text-2xl font-bold",
              type === 'expense' ? "text-destructive" : "text-success"
            )}>
              {formatCurrency(total)}
            </p>
          </div>

          {/* List */}
          <div className="space-y-2 overflow-y-auto max-h-[calc(70vh-180px)]">
            {items.map((item) => {
              const partner = partners.find(p => p.userId === item.baseTransaction.handledBy);
              const category = categories.find(c => c.id === item.baseTransaction.categoryId);
              
              return (
                <div
                  key={`${item.baseTransaction.id}-${item.nextDate}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    type === 'expense' ? "bg-destructive/10" : "bg-success/10"
                  )}>
                    {type === 'expense' ? (
                      <ArrowUpRight size={18} className="text-destructive" />
                    ) : (
                      <ArrowDownLeft size={18} className="text-success" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {item.baseTransaction.title || item.baseTransaction.vendor}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {format(parseISO(item.nextDate), 'MMM d, yyyy')}
                      </span>
                      <span>•</span>
                      <span>{getFrequencyLabel(item.frequency)}</span>
                      {category && (
                        <>
                          <span>•</span>
                          <span>{category.name}</span>
                        </>
                      )}
                    </div>
                    {partner && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span 
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: partner.color }}
                        >
                          {partner.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">{partner.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "font-semibold",
                      type === 'expense' ? "text-destructive" : "text-success"
                    )}>
                      {type === 'expense' ? '-' : '+'}
                      {formatCurrency(item.baseTransaction.amount)}
                    </p>
                    {item.daysUntil <= 7 && (
                      <span className={cn(
                        "text-[10px] font-medium",
                        item.daysUntil <= 3 ? "text-warning" : "text-muted-foreground"
                      )}>
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
        </SheetContent>
      </Sheet>
    </>
  );
};

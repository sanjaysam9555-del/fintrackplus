import { useState, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, Calendar, Trash2 } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { Transaction } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/CategoryIcon";

const EditTransactionSheet = lazy(() => import("@/components/EditTransactionSheet").then(m => ({ default: m.EditTransactionSheet })));

interface RecurringSectionProps {
  onBack: () => void;
  userId?: string;
  isEmployee?: boolean;
}

const frequencyLabel: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const frequencyColor: Record<string, string> = {
  daily: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  weekly: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  monthly: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  yearly: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

export const RecurringSection = ({ onBack, userId, isEmployee }: RecurringSectionProps) => {
  const { transactions, categories, refreshData } = useFinanceStore();
  const { getNextOccurrence } = useRecurringTransactions();
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const recurringExpenses = useMemo(() => 
    transactions.filter(t => t.isRecurring && t.recurringFrequency && t.type === 'expense'),
    [transactions]
  );

  const recurringIncome = useMemo(() => 
    transactions.filter(t => t.isRecurring && t.recurringFrequency && t.type === 'income'),
    [transactions]
  );

  const handleRemoveRecurring = async (t: Transaction) => {
    setRemovingId(t.id);
    const { error } = await supabase
      .from('transactions')
      .update({ is_recurring: false, recurring_frequency: null })
      .eq('id', t.id);

    if (error) {
      toast.error('Failed to remove recurring status');
      setRemovingId(null);
      return;
    }

    // Wait for animation then refresh
    setTimeout(() => {
      refreshData?.();
      setRemovingId(null);
      toast.success(`"${t.title || t.vendor}" is no longer recurring`);
    }, 400);
  };

  const getCategoryForTransaction = (t: Transaction) => 
    categories.find(c => c.id === t.categoryId);

  const renderItem = (t: Transaction, index: number) => {
    const category = getCategoryForTransaction(t);
    const nextDate = getNextOccurrence(t);
    const isRemoving = removingId === t.id;

    return (
      <motion.div
        key={t.id}
        initial={{ opacity: 0, y: 8 }}
        animate={isRemoving 
          ? { opacity: 0, height: 0, scale: 0.95, marginBottom: 0 } 
          : { opacity: 1, y: 0 }
        }
        transition={isRemoving 
          ? { duration: 0.35, ease: 'easeInOut' } 
          : { delay: index * 0.03 }
        }
        className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 overflow-hidden"
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          onClick={() => setEditTransaction(t)}
          style={{ backgroundColor: category?.color ? `${category.color}20` : undefined }}
        >
          {category ? (
            <CategoryIcon icon={category.icon} color={category.color} size={18} />
          ) : (
            <RefreshCw size={18} className="text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditTransaction(t)}>
          <p className="font-medium text-sm truncate">{t.title || t.vendor}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn(
              "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full",
              frequencyColor[t.recurringFrequency || ''] || 'bg-muted text-muted-foreground'
            )}>
              {frequencyLabel[t.recurringFrequency || ''] || t.recurringFrequency}
            </span>
            {nextDate && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar size={10} />
                Next: {format(parseISO(nextDate), 'dd MMM')}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className={cn(
            "font-semibold text-sm",
            t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
          )}>
            ₹{t.amount.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Remove button */}
        {!isEmployee && (
          <button
            onClick={(e) => { e.stopPropagation(); handleRemoveRecurring(t); }}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
            title="Remove recurring"
          >
            <Trash2 size={14} />
          </button>
        )}
      </motion.div>
    );
  };

  const renderList = (items: Transaction[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <RefreshCw size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No recurring entries</p>
          <p className="text-sm text-muted-foreground mt-1">
            Mark transactions as recurring when adding or editing them
          </p>
        </div>
      );
    }

    return (
      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {items.map((t, i) => renderItem(t, i))}
        </div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Recurring</h1>
            <p className="text-sm text-muted-foreground">
              {recurringExpenses.length + recurringIncome.length} active recurring entries
            </p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="expenses" className="flex-1">
              Expenses ({recurringExpenses.length})
            </TabsTrigger>
            <TabsTrigger value="income" className="flex-1">
              Income ({recurringIncome.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            {renderList(recurringExpenses)}
          </TabsContent>

          <TabsContent value="income">
            {renderList(recurringIncome)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Transaction Sheet */}
      {editTransaction && (
        <Suspense fallback={null}>
          <EditTransactionSheet
            transaction={editTransaction}
            isOpen={!!editTransaction}
            onClose={() => setEditTransaction(null)}
            userId={userId}
            isEmployee={isEmployee}
          />
        </Suspense>
      )}
    </div>
  );
};

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Transaction, PlannedInstallment } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PendingInstallmentsProps {
  transactions: Transaction[];
}

interface PendingItem {
  transactionId: string;
  vendor: string;
  totalExpected: number;
  pendingAmount: number;
  pendingCount: number;
  type: 'income' | 'expense';
}

const formatAmount = (amount: number): string => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString()}`;
};

export const PendingInstallments = ({ transactions }: PendingInstallmentsProps) => {
  const { incomeItems, expenseItems, totalPendingIncome, totalPendingExpense } = useMemo(() => {
    const items: PendingItem[] = [];

    transactions
      .filter(t => t.isPartPayment)
      .forEach(t => {
        // Handle plannedInstallments being either a string or array
        let installments: PlannedInstallment[] = [];
        if (t.plannedInstallments) {
          if (typeof t.plannedInstallments === 'string') {
            try { installments = JSON.parse(t.plannedInstallments as unknown as string); } catch { /* ignore */ }
          } else if (Array.isArray(t.plannedInstallments)) {
            installments = t.plannedInstallments;
          }
        }
        
        const pending = installments.filter(i => i.status === 'pending');
        if (pending.length === 0) return;
        const pendingAmount = pending.reduce((sum, i) => sum + i.amount, 0);
        items.push({
          transactionId: t.id,
          vendor: t.title || t.vendor,
          totalExpected: t.totalExpectedAmount || t.amount,
          pendingAmount,
          pendingCount: pending.length,
          type: t.type,
        });
      });

    const incomeItems = items.filter(i => i.type === 'income');
    const expenseItems = items.filter(i => i.type === 'expense');
    const totalPendingIncome = incomeItems.reduce((s, i) => s + i.pendingAmount, 0);
    const totalPendingExpense = expenseItems.reduce((s, i) => s + i.pendingAmount, 0);

    return { incomeItems, expenseItems, totalPendingIncome, totalPendingExpense };
  }, [transactions]);

  if (incomeItems.length === 0 && expenseItems.length === 0) return null;

  const renderList = (items: PendingItem[], type: 'income' | 'expense') => {
    if (items.length === 0) return null;
    const isIncome = type === 'income';
    const total = isIncome ? totalPendingIncome : totalPendingExpense;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isIncome ? (
              <TrendingUp size={14} className="text-emerald-500" />
            ) : (
              <TrendingDown size={14} className="text-destructive" />
            )}
            <span className="text-sm font-semibold">
              {isIncome ? 'Income Receivable' : 'Expenses Payable'}
            </span>
          </div>
          <span className={cn(
            "text-sm font-bold",
            isIncome ? "text-emerald-500" : "text-destructive"
          )}>
            {formatAmount(total)}
          </span>
        </div>
        <div className="space-y-1.5">
          {items.map((item) => (
            <div
              key={item.transactionId}
              className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.vendor}</p>
                <p className="text-xs text-muted-foreground">
                  {item.pendingCount} installment{item.pendingCount > 1 ? 's' : ''} pending
                </p>
              </div>
              <span className="text-sm font-semibold ml-3 shrink-0">
                {formatAmount(item.pendingAmount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-accent-foreground" />
        <h3 className="font-semibold">Pending Installments</h3>
      </div>
      <div className="space-y-4">
        {renderList(incomeItems, 'income')}
        {renderList(expenseItems, 'expense')}
      </div>
    </motion.div>
  );
};

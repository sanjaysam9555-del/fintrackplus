import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, Clock, ArrowDown, ArrowUp } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { format } from "date-fns";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InstallmentConfirmForm } from "@/components/InstallmentConfirmForm";
import { PaymentMethod } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DueInstallment {
  parentTransactionId: string;
  installmentId: string;
  parentVendor: string;
  parentTitle?: string;
  parentType: string;
  amount: number;
  expectedDate: string;
}

interface InstallmentDueReminderProps {
  userId?: string;
}

export const InstallmentDueReminder = ({ userId }: InstallmentDueReminderProps) => {
  const { transactions, confirmInstallment } = useFinanceStore();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [expandedConfirmId, setExpandedConfirmId] = useState<string | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const dueInstallments = useMemo(() => {
    const due: DueInstallment[] = [];
    transactions.forEach(t => {
      if (!t.isPartPayment || !t.plannedInstallments?.length) return;
      t.plannedInstallments.forEach(inst => {
        if (inst.status === 'pending' && inst.expectedDate && inst.expectedDate <= todayStr && !dismissedIds.has(inst.id)) {
          due.push({
            parentTransactionId: t.id,
            installmentId: inst.id,
            parentVendor: t.vendor,
            parentTitle: t.title,
            parentType: t.type,
            amount: inst.amount,
            expectedDate: inst.expectedDate,
          });
        }
      });
    });
    due.sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
    return due;
  }, [transactions, todayStr, dismissedIds]);

  const handleConfirm = async (item: DueInstallment, paymentMethod: PaymentMethod, partnerId?: string) => {
    setConfirmingId(item.installmentId);
    confirmInstallment(item.parentTransactionId, item.installmentId, userId, { paymentMethod, partnerId });
    setExpandedConfirmId(null);
    setTimeout(() => setConfirmingId(null), 500);
  };

  const handleDismiss = (installmentId: string) => {
    setDismissedIds(prev => new Set([...prev, installmentId]));
  };

  const handleDismissAll = () => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      dueInstallments.forEach(d => next.add(d.installmentId));
      return next;
    });
    setShowDialog(false);
  };

  if (dueInstallments.length === 0) return null;

  const formatAmount = (amount: number) => `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN')}`;

  return (
    <>
      {/* Banner */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowDialog(true)}
        className="w-full mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-left hover:bg-amber-500/15 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <Bell size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {dueInstallments.length} Installment{dueInstallments.length !== 1 ? 's' : ''} Due
          </p>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/80 truncate">
            {formatAmount(dueInstallments.reduce((s, d) => s + d.amount, 0))} total · Tap to review
          </p>
        </div>
        <Clock size={16} className="text-amber-500 shrink-0" />
      </motion.button>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell size={18} className="text-amber-500" />
              Due Installments
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {dueInstallments.map((item) => {
              const isOverdue = item.expectedDate < todayStr;
              return (
                <motion.div
                  key={item.installmentId}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-card rounded-xl border border-border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {item.parentType === 'income' ? (
                          <ArrowDown size={14} className="text-success shrink-0" />
                        ) : (
                          <ArrowUp size={14} className="text-destructive shrink-0" />
                        )}
                        <p className="font-medium text-sm truncate">
                          {item.parentTitle || item.parentVendor}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.parentVendor}
                      </p>
                    </div>
                    <p className="font-bold text-sm shrink-0">{formatAmount(item.amount)}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                      isOverdue
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    )}>
                      {isOverdue ? `Overdue since ${format(new Date(item.expectedDate), 'MMM d')}` : `Due today`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => handleDismiss(item.installmentId)}
                      >
                        Later
                      </Button>
                      {expandedConfirmId !== item.installmentId && (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={confirmingId === item.installmentId}
                          onClick={() => setExpandedConfirmId(item.installmentId)}
                        >
                          <Check size={14} className="mr-1" />
                          {confirmingId === item.installmentId ? 'Done!' : 'Received'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {expandedConfirmId === item.installmentId && (
                    <InstallmentConfirmForm
                      defaultPaymentMethod={
                        (transactions.find(t => t.id === item.parentTransactionId)?.paymentMethod as PaymentMethod) || 'cash'
                      }
                      defaultPartnerId={
                        transactions.find(t => t.id === item.parentTransactionId)?.partnerId
                      }
                      amount={item.amount}
                      onConfirm={(pm, pid) => handleConfirm(item, pm, pid)}
                      onCancel={() => setExpandedConfirmId(null)}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {dueInstallments.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={handleDismissAll}
            >
              Remind Later for All
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

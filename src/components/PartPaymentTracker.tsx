import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SplitSquareHorizontal, Plus, ChevronRight, TrendingUp, TrendingDown, Check, Pencil } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Transaction, PlannedInstallment, PaymentMethod } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { InstallmentConfirmForm } from "@/components/InstallmentConfirmForm";
import { findPartnerByHandledBy } from "@/lib/partnerIdentity";

interface PartPaymentTrackerProps {
  onAddNextPayment?: (parentTransaction: Transaction) => void;
  onEditPayment?: (transaction: Transaction) => void;
}

export const PartPaymentTracker = ({ onAddNextPayment, onEditPayment }: PartPaymentTrackerProps) => {
  const { transactions, categories, projects, partners, confirmInstallment } = useFinanceStore();
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmingInstId, setConfirmingInstId] = useState<string | null>(null);

  // Get all part payment transactions
  const partPayments = useMemo(() => {
    return transactions.filter(t => t.isPartPayment && t.totalExpectedAmount);
  }, [transactions]);

  // Group linked transactions
  const groupedPayments = useMemo(() => {
    const groups: { parent: Transaction; linkedPayments: Transaction[]; totalPaid: number; remaining: number; progress: number }[] = [];
    
    // Find parent transactions (ones that don't have linkedTransactionId but are marked as part payment)
    const parentTransactions = partPayments.filter(t => !t.linkedTransactionId);
    
    parentTransactions.forEach(parent => {
      const linked = transactions.filter(t => t.linkedTransactionId === parent.id);
      const totalPaid = parent.amount + linked.reduce((sum, t) => sum + t.amount, 0);
      const totalExpected = parent.totalExpectedAmount || parent.amount;
      const remaining = Math.max(0, totalExpected - totalPaid);
      const progress = Math.min(100, (totalPaid / totalExpected) * 100);
      
      groups.push({
        parent,
        linkedPayments: linked,
        totalPaid,
        remaining,
        progress
      });
    });
    
    return groups.sort((a, b) => b.remaining - a.remaining); // Show those with remaining amounts first
  }, [partPayments, transactions]);

  if (groupedPayments.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
          <SplitSquareHorizontal size={24} className="text-amber-500" />
        </div>
        <p className="text-muted-foreground text-sm">
          No part payments yet. When adding a transaction, toggle "Mark as part payment" to track installments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groupedPayments.map((group) => {
        const category = categories.find(c => c.id === group.parent.categoryId);
        const project = projects.find(p => p.id === group.parent.projectId);
        const partner = findPartnerByHandledBy(partners, group.parent.handledBy);
        const isExpanded = expandedId === group.parent.id;
        const isComplete = group.remaining === 0;
        
        return (
          <motion.div
            key={group.parent.id}
            layout
            className={cn(
              "bg-card rounded-xl border overflow-hidden transition-colors",
              isComplete ? "border-success/30" : "border-amber-500/30"
            )}
          >
            {/* Header */}
            <div className="flex items-center">
              <button
                onClick={() => setExpandedId(isExpanded ? null : group.parent.id)}
                className="flex-1 p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                        group.parent.type === 'expense' ? "bg-destructive/10" : "bg-success/10"
                      )}
                    >
                      {group.parent.type === 'expense' ? (
                        <TrendingDown size={14} className="text-destructive" />
                      ) : (
                        <TrendingUp size={14} className="text-success" />
                      )}
                    </div>
                    <span className="font-medium truncate">
                      {group.parent.title || group.parent.vendor}
                    </span>
                    {isComplete && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success rounded-full font-medium">
                        Complete
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {category?.name} {project && `• ${project.name}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "font-bold",
                    isComplete ? "text-success" : "text-amber-500"
                  )}>
                    {CURRENCY_SYMBOL}{group.totalPaid.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {CURRENCY_SYMBOL}{(group.parent.totalExpectedAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <ChevronRight 
                  size={16} 
                  className={cn(
                    "text-muted-foreground transition-transform shrink-0 mt-1",
                    isExpanded && "rotate-90"
                  )} 
                />
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <Progress 
                  value={group.progress} 
                  className={cn(
                    "h-2",
                    isComplete ? "[&>div]:bg-success" : "[&>div]:bg-amber-500"
                  )}
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{Math.round(group.progress)}% paid</span>
                  {!isComplete && (
                    <span>{CURRENCY_SYMBOL}{group.remaining.toLocaleString('en-IN')} remaining</span>
                  )}
                </div>
              </div>
              </button>
              
              {/* Edit Button */}
              {onEditPayment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPayment(group.parent);
                  }}
                  className="p-3 pr-4 hover:bg-muted/50 transition-colors"
                  title="Edit part payment"
                >
                  <Pencil size={16} className="text-muted-foreground" />
                </button>
              )}
            </div>
            
            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="p-4 space-y-3 bg-muted/30">
                    {/* Pending Installments */}
                    {group.parent.plannedInstallments?.filter(i => i.status === 'pending').length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Pending Installments
                        </p>
                        {group.parent.plannedInstallments
                          .filter(i => i.status === 'pending')
                          .map((inst) => (
                          <div key={inst.id} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">
                                    {CURRENCY_SYMBOL}{inst.amount.toLocaleString('en-IN')}
                                  </p>
                                  {inst.expectedDate && (
                                    <p className="text-xs text-muted-foreground">
                                      Expected: {format(parseISO(inst.expectedDate), 'MMM dd, yyyy')}
                                    </p>
                                  )}
                                </div>
                                {confirmingInstId !== inst.id && (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmingInstId(inst.id);
                                    }}
                                    className="bg-success hover:bg-success/90 text-white text-xs"
                                  >
                                    <Check size={12} className="mr-1" />
                                    Confirm
                                  </Button>
                                )}
                              </div>
                              {confirmingInstId === inst.id && (
                                <InstallmentConfirmForm
                                  defaultPaymentMethod={group.parent.paymentMethod as PaymentMethod}
                                  defaultHandledBy={group.parent.handledBy}
                                  amount={inst.amount}
                                  onConfirm={(pm, pid) => {
                                    confirmInstallment(group.parent.id, inst.id, user?.id, { paymentMethod: pm, handledBy: pid });
                                    setConfirmingInstId(null);
                                  }}
                                  onCancel={() => setConfirmingInstId(null)}
                                />
                              )}
                            </div>
                          ))}
                      </div>
                    ) : null}
                    
                    {/* Payment History */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Payment History
                      </p>
                      
                      {/* First payment */}
                      <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Initial Payment</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(group.parent.date), 'MMM dd, yyyy')}</p>
                        </div>
                        <span className="font-semibold">{CURRENCY_SYMBOL}{group.parent.amount.toLocaleString('en-IN')}</span>
                      </div>
                      
                      {/* Linked payments */}
                      {group.linkedPayments.map((payment, idx) => (
                        <div key={payment.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Payment #{idx + 2}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(payment.date), 'MMM dd, yyyy')}</p>
                          </div>
                          <span className="font-semibold">{CURRENCY_SYMBOL}{payment.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      
                      {/* Received installments from plannedInstallments */}
                      {group.parent.plannedInstallments
                        ?.filter(i => i.status === 'received')
                        .map((inst, idx) => (
                          <div key={inst.id} className="flex items-center justify-between p-2 bg-success/5 border border-success/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-success" />
                              <div>
                                <p className="text-sm font-medium">Installment Received</p>
                                <p className="text-xs text-muted-foreground">
                                  {inst.receivedDate ? format(parseISO(inst.receivedDate), 'MMM dd, yyyy') : 'Received'}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-success">{CURRENCY_SYMBOL}{inst.amount.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                    </div>
                    
                    {/* Add Next Payment Button */}
                    {!isComplete && onAddNextPayment && (
                      <Button
                        onClick={() => onAddNextPayment(group.parent)}
                        variant="outline"
                        className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Next Payment ({CURRENCY_SYMBOL}{group.remaining.toLocaleString('en-IN')} remaining)
                      </Button>
                    )}
                    
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {partner && (
                        <div className="bg-background p-2 rounded-lg">
                          <span className="text-muted-foreground">Partner:</span>
                          <span className="ml-1 font-medium">{partner.name}</span>
                        </div>
                      )}
                      <div className="bg-background p-2 rounded-lg">
                        <span className="text-muted-foreground">Method:</span>
                        <span className="ml-1 font-medium capitalize">{group.parent.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFinanceStore } from "@/lib/store";
import { Transaction, Partner } from "@/lib/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/constants";
import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Banknote, CreditCard } from "lucide-react";
import { getPartnerHandledByKey, isHandledByAssignedToAnyPartner } from "@/lib/partnerIdentity";

interface UnassignedTransactionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  userId?: string;
}

export const UnassignedTransactionsSheet = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  userId,
}: UnassignedTransactionsSheetProps) => {
  const { transactions, categories, partners, projects, updateTransaction } = useFinanceStore();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const unassignedTransactions = useMemo(() => {
    return transactions
      .filter(t => t.date >= startDate && t.date <= endDate)
      .filter(t => !isHandledByAssignedToAnyPartner(partners, t.handledBy))
      .sort((a, b) => {
        const d = b.date.localeCompare(a.date);
        return d !== 0 ? d : b.time.localeCompare(a.time);
      });
  }, [transactions, partners, startDate, endDate]);

  const handleAssign = (transactionId: string, handledBy: string) => {
    updateTransaction(transactionId, { handledBy }, userId);
    setAssigningId(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Unassigned Entries ({unassignedTransactions.length})
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            These transactions are excluded from partner balances. Assign a partner to include them.
          </p>
        </SheetHeader>

        <div className="overflow-y-auto px-4 pb-8 space-y-2" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {unassignedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">🎉 All entries are assigned!</p>
            </div>
          ) : (
            unassignedTransactions.map((t) => {
              const category = categories.find(c => c.id === t.categoryId);
              const project = projects.find(p => p.id === t.projectId);
              const isExpense = t.type === 'expense';

              return (
                <div
                  key={t.id}
                  className="bg-card rounded-xl border border-border/50 p-3 space-y-2"
                >
                  {/* Transaction info row */}
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon
                      iconName={category?.icon || 'Circle'}
                      colorClass={category?.color || 'category-other'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t.title || t.vendor || category?.name || 'Transaction'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDate(t.date)} • {formatTime(t.time)}
                        {project ? ` • ${project.name}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {t.paymentMethod === 'cash' ? (
                        <Banknote size={12} className="text-muted-foreground" />
                      ) : (
                        <CreditCard size={12} className="text-muted-foreground" />
                      )}
                      <p className={cn(
                        "text-sm font-bold whitespace-nowrap",
                        isExpense ? "text-destructive" : "text-success"
                      )}>
                        {isExpense ? '-' : '+'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Assign control */}
                  <Select
                    value=""
                    onValueChange={(handledBy) => handleAssign(t.id, handledBy)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Assign to team member…" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map((p) => {
                        const key = getPartnerHandledByKey(p);
                        if (!key) return null;
                        return (
                          <SelectItem key={p.id} value={key}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: p.color }}
                              />
                              {p.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

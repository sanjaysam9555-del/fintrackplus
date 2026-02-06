import { useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useFinanceStore } from "@/lib/store";
import { Partner, Transaction } from "@/lib/types";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TransactionItem } from "@/components/TransactionItem";
import { Banknote, CreditCard, TrendingUp, TrendingDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface PartnerPeriodBalance {
  partner: Partner;
  openingCashBalance: number;
  openingOnlineBalance: number;
  periodCashIncome: number;
  periodCashExpense: number;
  periodOnlineIncome: number;
  periodOnlineExpense: number;
  closingCashBalance: number;
  closingOnlineBalance: number;
  periodCashTxnCount: number;
  periodOnlineTxnCount: number;
}

interface PartnerDetailSheetProps {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
  dateRange: { start: string; end: string };
  balanceData: PartnerPeriodBalance | null;
  periodLabel: string;
  userId?: string;
}

export const PartnerDetailSheet = ({
  partner,
  isOpen,
  onClose,
  dateRange,
  balanceData,
  periodLabel,
  userId,
}: PartnerDetailSheetProps) => {
  const { transactions, getCategoryById } = useFinanceStore();
  const [incomeOpen, setIncomeOpen] = useState(true);
  const [expenseOpen, setExpenseOpen] = useState(true);

  // Filter transactions for this partner and date range
  const partnerTransactions = useMemo(() => {
    if (!partner) return [];
    return transactions
      .filter(t => 
        t.partnerId === partner.id && 
        t.date >= dateRange.start && 
        t.date <= dateRange.end
      )
      .sort((a, b) => {
        // Sort by date desc, then time desc
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      });
  }, [transactions, partner, dateRange]);

  const incomeTransactions = useMemo(() => 
    partnerTransactions.filter(t => t.type === 'income'),
    [partnerTransactions]
  );

  const expenseTransactions = useMemo(() => 
    partnerTransactions.filter(t => t.type === 'expense'),
    [partnerTransactions]
  );

  if (!partner || !balanceData) return null;

  const totalTransactions = partnerTransactions.length;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        {/* Header */}
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: partner.color }}
            >
              {partner.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <DrawerTitle className="text-left">{partner.name}</DrawerTitle>
              <DrawerDescription className="text-left">
                Money handled by this partner
              </DrawerDescription>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-4 pb-8 pt-4 space-y-4">
          {/* Period Label */}
          <div className="text-center">
            <span className="text-sm text-muted-foreground">Summary for </span>
            <span className="text-sm font-semibold text-foreground">{periodLabel}</span>
          </div>

          {/* Balance Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Cash Balance */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Banknote size={16} />
                <span className="text-sm font-medium">Cash</span>
              </div>
              
              <p className={cn(
                "text-xl font-bold",
                balanceData.closingCashBalance >= 0 ? "text-success" : "text-destructive"
              )}>
                {balanceData.closingCashBalance < 0 && '-'}
                {CURRENCY_SYMBOL}{Math.abs(balanceData.closingCashBalance).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mb-3">Closing Balance</p>
              
              <div className="space-y-1.5 text-xs border-t border-border/50 pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opening</span>
                  <span className={balanceData.openingCashBalance >= 0 ? "" : "text-destructive"}>
                    {balanceData.openingCashBalance < 0 && '-'}
                    {CURRENCY_SYMBOL}{Math.abs(balanceData.openingCashBalance).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-success">
                  <span>+ Income</span>
                  <span>{CURRENCY_SYMBOL}{balanceData.periodCashIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>− Expense</span>
                  <span>{CURRENCY_SYMBOL}{balanceData.periodCashExpense.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Online Balance */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CreditCard size={16} />
                <span className="text-sm font-medium">Online</span>
              </div>
              
              <p className={cn(
                "text-xl font-bold",
                balanceData.closingOnlineBalance >= 0 ? "text-success" : "text-destructive"
              )}>
                {balanceData.closingOnlineBalance < 0 && '-'}
                {CURRENCY_SYMBOL}{Math.abs(balanceData.closingOnlineBalance).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mb-3">Closing Balance</p>
              
              <div className="space-y-1.5 text-xs border-t border-border/50 pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opening</span>
                  <span className={balanceData.openingOnlineBalance >= 0 ? "" : "text-destructive"}>
                    {balanceData.openingOnlineBalance < 0 && '-'}
                    {CURRENCY_SYMBOL}{Math.abs(balanceData.openingOnlineBalance).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-success">
                  <span>+ Income</span>
                  <span>{CURRENCY_SYMBOL}{balanceData.periodOnlineIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>− Expense</span>
                  <span>{CURRENCY_SYMBOL}{balanceData.periodOnlineExpense.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Section */}
          {totalTransactions === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions in this period</p>
            </div>
          ) : (
            <>
              {/* Income Transactions */}
              {incomeTransactions.length > 0 && (
                <Collapsible open={incomeOpen} onOpenChange={setIncomeOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-success" />
                      <span className="font-semibold text-success">Income Entries</span>
                      <span className="text-sm text-muted-foreground">({incomeTransactions.length})</span>
                    </div>
                    <ChevronDown 
                      size={18} 
                      className={cn(
                        "text-muted-foreground transition-transform",
                        incomeOpen && "rotate-180"
                      )} 
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <AnimatePresence mode="popLayout">
                      <motion.div className="space-y-2 pt-2">
                        {incomeTransactions.map((transaction) => (
                          <TransactionItem
                            key={transaction.id}
                            transaction={transaction}
                            category={getCategoryById(transaction.categoryId)}
                            userId={userId}
                          />
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Expense Transactions */}
              {expenseTransactions.length > 0 && (
                <Collapsible open={expenseOpen} onOpenChange={setExpenseOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-destructive" />
                      <span className="font-semibold text-destructive">Expense Entries</span>
                      <span className="text-sm text-muted-foreground">({expenseTransactions.length})</span>
                    </div>
                    <ChevronDown 
                      size={18} 
                      className={cn(
                        "text-muted-foreground transition-transform",
                        expenseOpen && "rotate-180"
                      )} 
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <AnimatePresence mode="popLayout">
                      <motion.div className="space-y-2 pt-2">
                        {expenseTransactions.map((transaction) => (
                          <TransactionItem
                            key={transaction.id}
                            transaction={transaction}
                            category={getCategoryById(transaction.categoryId)}
                            userId={userId}
                          />
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

import { useMemo, useState, useRef, useCallback } from "react";
import { useFinanceStore } from "@/lib/store";
import { SummaryCard } from "./SummaryCard";
import { CashFlowChart } from "./CashFlowChart";
import { TransactionItem } from "./TransactionItem";
import { DashboardSkeleton } from "./ui/skeleton-loader";
import { InstallmentDueReminder } from "./InstallmentDueReminder";
import { TimeFrameDropdown, computeDateRange } from "./TimeFrameSelector";
import { useUserRole } from "@/hooks/useUserRole";

import { motion } from "framer-motion";
import { ArrowUpDown, Grid3X3, Store, ScrollText, FileBarChart, Users, Tag, FileText, ClipboardCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface DashboardProps {
  isLoading?: boolean;
  onAddClick?: () => void;
  onNavigate?: (tab: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isOnline?: boolean;
  pendingCount?: number;
  userId?: string;
  onEditSheetChange?: (isOpen: boolean) => void;
  isEmployee?: boolean;
}

export const Dashboard = ({ isLoading = false, onAddClick, onNavigate, onRefresh, isRefreshing, isOnline = true, pendingCount = 0, userId, onEditSheetChange, isEmployee = false }: DashboardProps) => {
  const { transactions, categories, partners, getTotalIncome, getTotalExpense, userProfile, syncStatus, lastSyncedAt, activeTimeFilter, activeCustomStartDate, activeCustomEndDate, setActiveTimeFilter, setActiveCustomDateRange } = useFinanceStore();
  const { isOwner, canViewPartners } = useUserRole();
  const timeFilter = activeTimeFilter;
  const customStartDate = useMemo(
    () => (activeCustomStartDate ? new Date(activeCustomStartDate) : undefined),
    [activeCustomStartDate]
  );
  const customEndDate = useMemo(
    () => (activeCustomEndDate ? new Date(activeCustomEndDate) : undefined),
    [activeCustomEndDate]
  );
  const setTimeFilter = setActiveTimeFilter;
  const setCustomStartDate = (date: Date | undefined) => setActiveCustomDateRange(date ? date.toISOString() : null, activeCustomEndDate);
  const setCustomEndDate = (date: Date | undefined) => setActiveCustomDateRange(activeCustomStartDate, date ? date.toISOString() : null);
  const [sortBy, setSortBy] = useState<string>('recent');

  const today = useMemo(() => new Date(), []);

  const dateRange = useMemo(() => {
    return computeDateRange(timeFilter, customStartDate, customEndDate);
  }, [timeFilter, customStartDate, customEndDate]);
  
  // Previous period for comparison
  const previousDateRange = useMemo(() => {
    const startDate = parseISO(dateRange.start);
    const endDate = parseISO(dateRange.end);
    const duration = endDate.getTime() - startDate.getTime();
    
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    
    return {
      start: format(prevStart, 'yyyy-MM-dd'),
      end: format(prevEnd, 'yyyy-MM-dd'),
    };
  }, [dateRange]);
  
  // Note: 'transactions' is intentionally kept in these dep arrays even though the
  // memo body doesn't reference it by name. getTotalIncome/getTotalExpense are stable
  // Zustand action references that read the live store via get() internally, so they
  // never change identity when transactions change. Without 'transactions' here, these
  // memos would keep returning stale totals after adding/editing/deleting a transaction.
  const currentIncome = useMemo(
    () => getTotalIncome(dateRange.start, dateRange.end),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getTotalIncome, dateRange, transactions]
  );
  const currentExpense = useMemo(
    () => getTotalExpense(dateRange.start, dateRange.end),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getTotalExpense, dateRange, transactions]
  );
  const previousIncome = useMemo(
    () => getTotalIncome(previousDateRange.start, previousDateRange.end),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getTotalIncome, previousDateRange, transactions]
  );
  const previousExpense = useMemo(
    () => getTotalExpense(previousDateRange.start, previousDateRange.end),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getTotalExpense, previousDateRange, transactions]
  );

  const incomeChange = previousIncome > 0
    ? ((currentIncome - previousIncome) / previousIncome) * 100
    : 0;
  const expenseChange = previousExpense > 0
    ? ((currentExpense - previousExpense) / previousExpense) * 100
    : 0;

  const netBalance = currentIncome - currentExpense;

  const totalHoldings = useMemo(() => {
    if (partners.length === 0) return 0;
    const initialBalances = partners.reduce((sum, p) => sum + (p.initialCashBalance || 0) + (p.initialOnlineBalance || 0), 0);
    return netBalance + initialBalances;
  }, [partners, netBalance]);

  // Pre-filter transactions for the chart once (avoid re-filtering on every render)
  const chartTransactions = useMemo(
    () => transactions.filter(t => t.date >= dateRange.start && t.date <= dateRange.end),
    [transactions, dateRange]
  );
  
  // Filter transactions based on selected date range
  const filteredTransactions = useMemo(() => {
    const base = isEmployee
      ? transactions.filter(t => t.userId === userId)
      : transactions;
    const filtered = base
      .filter(t => t.date >= dateRange.start && t.date <= dateRange.end)
      .slice();
    
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        break;
      case 'date-desc':
        filtered.sort((a, b) => {
          const d = b.date.localeCompare(a.date);
          return d !== 0 ? d : b.time.localeCompare(a.time);
        });
        break;
      case 'date-asc':
        filtered.sort((a, b) => {
          const d = a.date.localeCompare(b.date);
          return d !== 0 ? d : a.time.localeCompare(b.time);
        });
        break;
      case 'amount-desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
    }
    
    return filtered.slice(0, 10);
  }, [transactions, dateRange, sortBy, isEmployee, userId]);
  
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, [today]);
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="min-h-screen pb-40 md:pb-8 md:px-6">
      {/* Header */}
      <div className="p-4 safe-top">
        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary bg-primary/10 flex items-center justify-center"
              >
                {userProfile.avatar ? (
                  <img 
                    src={userProfile.avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-base font-bold text-primary">
                    {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </motion.div>
              <div>
                <p className="text-[11px] text-muted-foreground">{greeting},</p>
                <h1 className="text-sm font-bold leading-tight">{userProfile.name}</h1>
              </div>
            </div>

            <TimeFrameDropdown
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartDateChange={setCustomStartDate}
              onCustomEndDateChange={setCustomEndDate}
            />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary bg-primary/10 flex items-center justify-center"
              >
                {userProfile.avatar ? (
                  <img 
                    src={userProfile.avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-primary">
                    {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </motion.div>
              <div>
                <p className="text-sm text-muted-foreground">{greeting},</p>
                <h1 className="text-lg font-bold">{userProfile.name}</h1>
              </div>
            </div>

            <TimeFrameDropdown
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartDateChange={setCustomStartDate}
              onCustomEndDateChange={setCustomEndDate}
            />
          </div>
        </div>
      </div>
      
      {/* Installment Due Reminders */}
      <div className="px-4 lg:px-0">
        <InstallmentDueReminder userId={userId} />
      </div>

      {/* Summary Cards - hidden for employees */}
      {!isEmployee && (
        <div className="px-4 lg:px-0 mb-6">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "grid gap-2 lg:gap-4",
              partners.length > 0 ? "grid-cols-4" : "grid-cols-3"
            )}
          >
            <SummaryCard
              title="Income"
              amount={currentIncome}
              type="income"
            />
            <SummaryCard
              title="Expense"
              amount={currentExpense}
              type="expense"
            />
            <SummaryCard
              title="Balance"
              amount={netBalance}
              type="balance"
            />
            {partners.length > 0 && (
              <SummaryCard
                title="Holdings"
                amount={totalHoldings}
                type="holdings"
              />
            )}
          </motion.div>
        </div>
      )}
      
      {/* Cash Flow Chart - hidden for employees */}
      {!isEmployee && (
        <div className="px-4 lg:px-0 mb-6">
          <CashFlowChart 
            transactions={chartTransactions} 
            timeFilter={timeFilter}
            dateRange={dateRange}
          />
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="px-4 lg:px-0 mb-6">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-2 lg:gap-3"
        >
          {[
            { key: 'categories', label: 'Categories', icon: Grid3X3, iconColor: 'text-accent-foreground' },
            { key: 'vendors', label: 'Vendors', icon: Store, iconColor: 'text-success' },
            ...(!isEmployee ? [{ key: 'logs', label: 'Logs', icon: ScrollText, iconColor: 'text-amber-500 dark:text-amber-400' }] : []),
            ...(!isEmployee ? [{ key: 'reports', label: 'Reports', icon: FileBarChart, iconColor: 'text-purple-500 dark:text-purple-400' }] : []),
            ...(canViewPartners ? [{ key: 'partners', label: 'Holdings', icon: Users, iconColor: 'text-blue-500 dark:text-blue-400' }] : []),
            ...(!isEmployee ? [{ key: 'labels', label: 'Labels', icon: Tag, iconColor: 'text-pink-500 dark:text-pink-400' }] : []),
            ...(isOwner ? [{ key: 'documents', label: 'Documents', icon: FileText, iconColor: 'text-cyan-500 dark:text-cyan-400' }] : []),
            ...(isOwner ? [{ key: 'approvals', label: 'Approval', icon: ClipboardCheck, iconColor: 'text-orange-500 dark:text-orange-400' }] : []),
          ].map((item, index) => (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.(item.key)}
              className="flex flex-col items-center justify-center gap-1 text-center px-2 h-[4.5rem] lg:h-20 bg-muted border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-muted/80 hover:border-border/80 active:bg-muted/70 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)] transition-all"
            >
              <item.icon size={16} className={cn(item.iconColor, "shrink-0")} />
              <span className="max-w-full whitespace-nowrap overflow-hidden text-ellipsis text-[11px] lg:text-xs font-semibold text-foreground leading-none">
                {item.label}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>
      
      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Recent Transactions</h2>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-7 text-xs gap-1 border-muted">
              <ArrowUpDown size={12} className="text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="date-desc">Date (Newest)</SelectItem>
              <SelectItem value="date-asc">Date (Oldest)</SelectItem>
              <SelectItem value="amount-desc">Amount (High)</SelectItem>
              <SelectItem value="amount-asc">Amount (Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground">No transactions in this period</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try selecting a different time frame
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <TransactionItem
                  transaction={transaction}
                  category={categories.find(c => c.id === transaction.categoryId)}
                  userId={userId}
                  onEditSheetChange={onEditSheetChange}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import { useMemo, useState, useRef, useCallback } from "react";
import { useFinanceStore } from "@/lib/store";
import { SummaryCard } from "./SummaryCard";
import { CashFlowChart } from "./CashFlowChart";
import { TransactionItem } from "./TransactionItem";
import { DashboardSkeleton } from "./ui/skeleton-loader";
import { InstallmentDueReminder } from "./InstallmentDueReminder";
import { TimeFrameSelector, computeDateRange } from "./TimeFrameSelector";
import type { TimeFilter } from "./TimeFrameSelector";

import { motion } from "framer-motion";
import { Grid3X3, Store, ScrollText, FileBarChart, Settings, Sparkles, Search, ArrowUpDown } from "lucide-react";
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
  onSearchClick?: () => void;
  onEditSheetChange?: (isOpen: boolean) => void;
  isEmployee?: boolean;
}

export const Dashboard = ({ isLoading = false, onAddClick, onNavigate, onRefresh, isRefreshing, isOnline = true, pendingCount = 0, userId, onSearchClick, onEditSheetChange, isEmployee = false }: DashboardProps) => {
  const { transactions, categories, partners, getTotalIncome, getTotalExpense, userProfile, syncStatus, lastSyncedAt, defaultTimeFilter } = useFinanceStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(defaultTimeFilter);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('recent');
  
  const today = new Date();
  
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
  
  const currentIncome = getTotalIncome(dateRange.start, dateRange.end);
  const currentExpense = getTotalExpense(dateRange.start, dateRange.end);
  const previousIncome = getTotalIncome(previousDateRange.start, previousDateRange.end);
  const previousExpense = getTotalExpense(previousDateRange.start, previousDateRange.end);
  
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
  }, []);
  
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
            
            {/* Mobile action icons - no calendar or sync */}
            <div className="flex items-center">
              {onSearchClick && (
                <button 
                  onClick={onSearchClick}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                  title="Search (⌘K)"
                >
                  <Search size={18} className="text-muted-foreground" />
                </button>
              )}
              {!isEmployee && (
                <button 
                  onClick={() => onNavigate?.('ai')}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <Sparkles size={18} className="text-muted-foreground" />
                </button>
              )}
              <button 
                onClick={() => onNavigate?.('settings')}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <Settings size={18} className="text-muted-foreground" />
              </button>
            </div>
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
            
            <div className="flex items-center gap-1">
              {onSearchClick && (
                <button 
                  onClick={onSearchClick}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  title="Search (⌘K)"
                >
                  <Search size={22} className="text-muted-foreground" />
                </button>
              )}
              {!isEmployee && (
                <button 
                  onClick={() => onNavigate?.('ai')}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <Sparkles size={22} className="text-muted-foreground" />
                </button>
              )}
              <button 
                onClick={() => onNavigate?.('settings')}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <Settings size={22} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Time Frame Selector */}
      <div className="px-4 lg:px-0 mb-4">
        <TimeFrameSelector
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
        />
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
            transactions={transactions.filter(t => t.date >= dateRange.start && t.date <= dateRange.end)} 
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
            { key: 'categories', icon: Grid3X3, label: 'Categories', color: 'bg-accent', iconColor: 'text-accent-foreground' },
            { key: 'vendors', icon: Store, label: 'Vendors', color: 'bg-success/10', iconColor: 'text-success' },
            ...(!isEmployee ? [{ key: 'logs', icon: ScrollText, label: 'Logs', color: 'bg-amber-500/10', iconColor: 'text-amber-500 dark:text-amber-400' }] : []),
            ...(!isEmployee ? [{ key: 'reports', icon: FileBarChart, label: 'Reports', color: 'bg-purple-500/10', iconColor: 'text-purple-500 dark:text-purple-400' }] : []),
          ].map((item, index) => (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.(item.key)}
              className="flex flex-col items-center text-center gap-1 p-2 lg:p-3 bg-card rounded-xl shadow-card border border-border hover:shadow-card-hover transition-shadow"
            >
              <div className={cn("w-6 h-6 lg:w-7 lg:h-7 rounded-lg flex items-center justify-center shrink-0", item.color)}>
                <item.icon size={12} className={cn(item.iconColor, "lg:hidden")} />
                <item.icon size={14} className={cn(item.iconColor, "hidden lg:block")} />
              </div>
              <span className="text-[9px] lg:text-xs font-medium text-muted-foreground leading-tight truncate w-full">{item.label}</span>
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
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-center py-8 bg-card rounded-xl border border-border"
            >
              <p className="text-muted-foreground">No transactions in this period</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try selecting a different time frame
              </p>
            </motion.div>
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

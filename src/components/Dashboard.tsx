import { useMemo, useState, useRef, useCallback } from "react";
import { useFinanceStore } from "@/lib/store";
import { SummaryCard } from "./SummaryCard";
import { CashFlowChart } from "./CashFlowChart";
import { TransactionItem } from "./TransactionItem";
import { DashboardSkeleton } from "./ui/skeleton-loader";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { CalendarDays, Grid3X3, Store, FolderKanban, FileBarChart, Settings, Sparkles, RefreshCw, Cloud, CloudOff, Loader2, WifiOff } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DashboardProps {
  isLoading?: boolean;
  onAddClick?: () => void;
  onNavigate?: (tab: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isOnline?: boolean;
  pendingCount?: number;
}

type TimeFilter = 'week' | 'month' | 'year' | 'custom';

export const Dashboard = ({ isLoading = false, onAddClick, onNavigate, onRefresh, isRefreshing, isOnline = true, pendingCount = 0 }: DashboardProps) => {
  const { transactions, categories, getTotalIncome, getTotalExpense, userProfile, syncStatus, lastSyncedAt } = useFinanceStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCustomCalendar, setShowCustomCalendar] = useState<'start' | 'end' | null>(null);
  
  const today = new Date();
  
  const dateRange = useMemo(() => {
    const todayDate = new Date();
    const start = new Date();
    
    switch (timeFilter) {
      case 'week':
        start.setDate(todayDate.getDate() - 7);
        break;
      case 'month':
        start.setDate(1);
        break;
      case 'year':
        start.setMonth(0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: format(customStartDate, 'yyyy-MM-dd'),
            end: format(customEndDate, 'yyyy-MM-dd'),
          };
        }
        start.setDate(1);
        break;
      default:
        start.setDate(1);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: todayDate.toISOString().split('T')[0],
    };
  }, [timeFilter, customStartDate, customEndDate]);
  
  // Previous period for comparison
  const previousDateRange = useMemo(() => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const duration = endDate.getTime() - startDate.getTime();
    
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    
    return {
      start: prevStart.toISOString().split('T')[0],
      end: prevEnd.toISOString().split('T')[0],
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
  
  // Filter transactions based on selected date range
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.date >= dateRange.start && t.date <= dateRange.end)
      .slice()
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      })
      .slice(0, 5);
  }, [transactions, dateRange]);
  
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);
  
  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'week': return 'This Week';
      case 'month': return format(today, 'MMMM yyyy');
      case 'year': return format(today, 'yyyy');
      case 'custom': 
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, 'MMM dd')} - ${format(customEndDate, 'MMM dd')}`;
        }
        return 'Custom';
      default: return format(today, 'MMMM yyyy');
    }
  };
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 pt-6">
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
            {onRefresh && (
              <button 
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RefreshCw 
                  size={20} 
                  className={cn(
                    "text-muted-foreground transition-all",
                    isRefreshing && "animate-spin"
                  )} 
                />
              </button>
            )}
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button className="p-2 rounded-full hover:bg-muted transition-colors">
                  <CalendarDays size={22} className={cn(
                    "transition-colors",
                    showDatePicker ? "text-primary" : "text-muted-foreground"
                  )} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 bg-card z-[60]" align="end" sideOffset={8}>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Time Frame</p>
                  
                  {/* Quick Filters */}
                  <div className="flex gap-1">
                    {(['week', 'month', 'year'] as TimeFilter[]).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setTimeFilter(filter);
                          setShowCustomCalendar(null);
                          setShowDatePicker(false);
                        }}
                        className={cn(
                          "flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                          timeFilter === filter && timeFilter !== 'custom'
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {filter === 'week' ? 'Week' : filter === 'month' ? 'Month' : 'Year'}
                      </button>
                    ))}
                  </div>
                  
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-[10px] text-muted-foreground mb-1.5">Custom</p>
                    <div className="flex gap-1.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "flex-1 px-2 py-1.5 text-xs rounded-md border text-center",
                              customStartDate ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                            )}
                          >
                            {customStartDate ? format(customStartDate, "MMM dd") : "From"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card z-[70]" align="start" side="bottom">
                          <Calendar
                            mode="single"
                            selected={customStartDate}
                            onSelect={(date) => {
                              setCustomStartDate(date);
                              if (date) setTimeFilter('custom');
                            }}
                            className="p-2 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <span className="text-xs text-muted-foreground self-center">–</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "flex-1 px-2 py-1.5 text-xs rounded-md border text-center",
                              customEndDate ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                            )}
                          >
                            {customEndDate ? format(customEndDate, "MMM dd") : "To"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card z-[70]" align="end" side="bottom">
                          <Calendar
                            mode="single"
                            selected={customEndDate}
                            onSelect={(date) => {
                              setCustomEndDate(date);
                              if (date && customStartDate) {
                                setTimeFilter('custom');
                                setShowDatePicker(false);
                              }
                            }}
                            disabled={(date) => customStartDate ? date < customStartDate : false}
                            className="p-2 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {timeFilter === 'custom' && customStartDate && customEndDate && (
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="w-full mt-2 px-2 py-1.5 bg-primary text-primary-foreground text-xs rounded-md font-medium"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <button 
              onClick={() => onNavigate?.('ai')}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Sparkles size={22} className="text-muted-foreground" />
            </button>
            <button 
              onClick={() => onNavigate?.('settings')}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Settings size={22} className="text-muted-foreground" />
            </button>
          </div>
        </div>
        
        {/* Time Filter Badge + Sync Status */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 flex-wrap"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
            <CalendarDays size={14} />
            {getTimeFilterLabel()}
          </span>
          
          {/* Sync Status Chip */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing || !isOnline}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors",
              !isOnline && "bg-amber-500/10 text-amber-600",
              isOnline && syncStatus === 'synced' && pendingCount === 0 && "bg-success/10 text-success",
              isOnline && syncStatus === 'syncing' && "bg-primary/10 text-primary",
              isOnline && syncStatus === 'error' && "bg-destructive/10 text-destructive",
              isOnline && syncStatus === 'idle' && "bg-muted text-muted-foreground",
              isOnline && pendingCount > 0 && syncStatus !== 'syncing' && "bg-amber-500/10 text-amber-600"
            )}
          >
            {!isOnline ? (
              <>
                <WifiOff size={12} />
                Offline{pendingCount > 0 ? ` (${pendingCount} pending)` : ''}
              </>
            ) : syncStatus === 'syncing' || isRefreshing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Syncing...
              </>
            ) : syncStatus === 'error' ? (
              <>
                <CloudOff size={12} />
                Sync Error
              </>
            ) : pendingCount > 0 ? (
              <>
                <Cloud size={12} />
                {pendingCount} pending
              </>
            ) : (
              <>
                <Cloud size={12} />
                {lastSyncedAt ? (
                  `Synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: false })} ago`
                ) : (
                  'Synced'
                )}
              </>
            )}
          </button>
        </motion.div>
      </div>
      
      {/* Summary Cards - 3 Column Grid */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <SummaryCard
            title="Income"
            amount={currentIncome}
            type="income"
            percentChange={incomeChange}
          />
          <SummaryCard
            title="Expense"
            amount={currentExpense}
            type="expense"
            percentChange={expenseChange}
          />
          <SummaryCard
            title="Balance"
            amount={netBalance}
            type="balance"
          />
        </motion.div>
      </div>
      
      {/* Cash Flow Chart */}
      <div className="px-4 mb-6">
        <CashFlowChart 
          transactions={transactions.filter(t => t.date >= dateRange.start && t.date <= dateRange.end)} 
          timeFilter={timeFilter}
          dateRange={dateRange}
        />
      </div>
      
      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-2"
        >
          <button
            onClick={() => onNavigate?.('categories')}
            className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl shadow-card border border-border hover:shadow-card-hover transition-shadow"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Grid3X3 size={16} className="text-primary" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">Categories</span>
          </button>
          <button
            onClick={() => onNavigate?.('vendors')}
            className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl shadow-card border border-border hover:shadow-card-hover transition-shadow"
          >
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Store size={16} className="text-success" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">Vendors</span>
          </button>
          <button
            onClick={() => onNavigate?.('projects')}
            className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl shadow-card border border-border hover:shadow-card-hover transition-shadow"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FolderKanban size={16} className="text-amber-500" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">Projects</span>
          </button>
          <button
            onClick={() => onNavigate?.('reports')}
            className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl shadow-card border border-border hover:shadow-card-hover transition-shadow"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <FileBarChart size={16} className="text-purple-500" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">Reports</span>
          </button>
        </motion.div>
      </div>
      
      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Recent Transactions</h2>
          <button className="text-sm text-primary font-medium">See All</button>
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TransactionItem
                  transaction={transaction}
                  category={categories.find(c => c.id === transaction.categoryId)}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

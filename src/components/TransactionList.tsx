import { useMemo, useState } from "react";
import { Transaction, TransactionType } from "@/lib/types";
import { useFinanceStore } from "@/lib/store";
import { formatDate as formatDateLabel, formatCurrency } from "@/lib/constants";
import { TransactionItem } from "./TransactionItem";
import { TransactionSkeleton } from "./ui/skeleton-loader";
import { UpcomingRecurringBanner } from "./UpcomingRecurringBanner";
import { Search, ArrowUpDown, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { format, differenceInDays, parseISO } from "date-fns";
import { TimeFrameSelector, computeDateRange, getTimeFilterLabel } from "./TimeFrameSelector";
import type { TimeFilter } from "./TimeFrameSelector";

interface TransactionListProps {
  type: TransactionType;
  userId?: string;
  onEditSheetChange?: (isOpen: boolean) => void;
  onSearchClick?: () => void;
  onNavigate?: (section: string) => void;
}

export const TransactionList = ({ type, userId, onEditSheetChange, onSearchClick, onNavigate }: TransactionListProps) => {
  const { transactions, categories, getTotalIncome, getTotalExpense, defaultTimeFilter } = useFinanceStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(defaultTimeFilter);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [uncategorizedFilter, setUncategorizedFilter] = useState<string | null>(null);
  
  const filteredCategories = categories.filter(c => c.type === type);
  
  const dateRange = useMemo(() => {
    return computeDateRange(timeFilter, customStartDate, customEndDate);
  }, [timeFilter, customStartDate, customEndDate]);
  
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === type)
      .filter(t => t.date >= dateRange.start && t.date <= dateRange.end)
      .filter(t => !selectedCategory || t.categoryId === selectedCategory)
      .filter(t => {
        if (uncategorizedFilter === 'no-category') {
          const notSpecifiedCat = categories.find(c => c.name === 'Not Specified' && c.type === type);
          return !t.categoryId || t.categoryId === '' || (notSpecifiedCat && t.categoryId === notSpecifiedCat.id);
        }
        if (uncategorizedFilter === 'no-project') return !t.projectId;
        if (uncategorizedFilter === 'no-vendor') return !t.vendor || t.vendor === 'Unknown' || t.vendor === '' || t.vendor === 'Not Specified';
        if (uncategorizedFilter === 'no-partner') return !t.partnerId;
        return true;
      });
  }, [transactions, type, dateRange, selectedCategory, uncategorizedFilter]);
  
  const total = type === 'income' 
    ? getTotalIncome(dateRange.start, dateRange.end)
    : getTotalExpense(dateRange.start, dateRange.end);
  
  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions];
    switch (sortBy) {
      case 'recent':
        sorted.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        break;
      case 'date-desc':
        sorted.sort((a, b) => {
          const d = b.date.localeCompare(a.date);
          return d !== 0 ? d : b.time.localeCompare(a.time);
        });
        break;
      case 'date-asc':
        sorted.sort((a, b) => {
          const d = a.date.localeCompare(b.date);
          return d !== 0 ? d : a.time.localeCompare(b.time);
        });
        break;
      case 'amount-desc':
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        sorted.sort((a, b) => a.amount - b.amount);
        break;
    }
    return sorted;
  }, [filteredTransactions, sortBy]);

  const isAmountSort = sortBy === 'amount-desc' || sortBy === 'amount-asc';

  const groupedTransactions = useMemo(() => {
    if (isAmountSort) return null; // flat list for amount sorts
    const groups: Record<string, Transaction[]> = {};
    sortedTransactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    if (sortBy === 'date-asc') {
      return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }
    if (sortBy === 'recent') {
      return Object.entries(groups).sort(([, aTxns], [, bTxns]) => {
        const aMax = Math.max(...aTxns.map(t => new Date(t.createdAt || 0).getTime()));
        const bMax = Math.max(...bTxns.map(t => new Date(t.createdAt || 0).getTime()));
        return bMax - aMax;
      });
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [sortedTransactions, sortBy, isAmountSort]);
  
  const chartData = useMemo(() => {
    // Parse as local dates to keep chart in sync with list filtering
    const startDate = parseISO(dateRange.start);
    const endDate = parseISO(dateRange.end);
    const today = new Date();
    const daysDiff = differenceInDays(endDate, startDate);
    
    const dataPoints: { name: string; value: number }[] = [];
    
    if (timeFilter === 'fy') {
      // Financial Year: Generate months from start to min(endDate, today)
      const actualEnd = endDate > today ? today : endDate;
      let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      
      while (current <= actualEnd) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        
        const monthTransactions = filteredTransactions.filter(t => {
          const d = parseISO(t.date);
          return d >= monthStart && d <= monthEnd;
        });
        
        dataPoints.push({
          name: format(monthStart, 'MMM'),
          value: monthTransactions.reduce((sum, t) => sum + t.amount, 0),
        });
        
        current.setMonth(current.getMonth() + 1);
      }
    } else if (timeFilter === 'week' || daysDiff <= 7) {
      // Show exact days within the date range
      for (let i = 0; i <= Math.min(daysDiff, 6); i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        
        if (day > endDate) break;
        
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTransactions = filteredTransactions.filter(t => t.date === dayStr);
        
        dataPoints.push({
          name: format(day, 'EEE'),
          value: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
        });
      }
    } else if (timeFilter === 'month' || (daysDiff > 7 && daysDiff <= 31)) {
      // Show weeks within the exact date range
      const numWeeks = Math.ceil(daysDiff / 7);
      for (let i = 0; i < numWeeks; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const clampedEnd = weekEnd > endDate ? endDate : weekEnd;
        
        const weekTransactions = filteredTransactions.filter(t => {
          const d = parseISO(t.date);
          return d >= weekStart && d <= clampedEnd;
        });
        
        dataPoints.push({
          name: `W${i + 1}`,
          value: weekTransactions.reduce((sum, t) => sum + t.amount, 0),
        });
      }
    } else if (timeFilter === 'year' || daysDiff > 31) {
      // Show months within the exact date range
      let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const actualEnd = endDate > today ? today : endDate;
      
      while (current <= actualEnd) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        
        const monthTransactions = filteredTransactions.filter(t => {
          const d = parseISO(t.date);
          return d >= monthStart && d <= monthEnd;
        });
        
        dataPoints.push({
          name: format(monthStart, 'MMM'),
          value: monthTransactions.reduce((sum, t) => sum + t.amount, 0),
        });
        
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      // Custom: determine based on days difference
      if (daysDiff <= 14) {
        for (let i = 0; i <= daysDiff; i++) {
          const day = new Date(startDate);
          day.setDate(startDate.getDate() + i);
          const dayStr = format(day, 'yyyy-MM-dd');
          
          const dayTransactions = filteredTransactions.filter(t => t.date === dayStr);
          
          dataPoints.push({
            name: format(day, 'd'),
            value: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
          });
        }
      } else {
        const numWeeks = Math.ceil(daysDiff / 7);
        for (let i = 0; i < numWeeks; i++) {
          const weekStart = new Date(startDate);
          weekStart.setDate(startDate.getDate() + (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const clampedEnd = weekEnd > endDate ? endDate : weekEnd;
          
          const weekTransactions = filteredTransactions.filter(t => {
            const d = parseISO(t.date);
            return d >= weekStart && d <= clampedEnd;
          });
          
          dataPoints.push({
            name: `W${i + 1}`,
            value: weekTransactions.reduce((sum, t) => sum + t.amount, 0),
          });
        }
      }
    }
    
    return dataPoints;
  }, [filteredTransactions, timeFilter, dateRange]);
  
  return (
    <div className="min-h-screen pb-40 md:pb-8 md:px-6">
      {/* Header */}
      <div className="p-4 safe-top flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {type === 'expense' ? 'Expenses' : 'Income'}
        </h1>
        <div className="flex items-center gap-1">
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Search (⌘K)"
            >
              <Search size={20} className="text-muted-foreground" />
            </button>
          )}
          {onNavigate && (
            <button
              onClick={() => onNavigate('settings')}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Settings size={20} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      
      {/* Time Filter Tabs */}
      <div className="px-4 mb-4">
        <TimeFrameSelector
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
        />
      </div>
      
      {/* Summary Card with Chart */}
      <div className="px-4 mb-4">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-card"
        >
          <p className="text-sm text-muted-foreground">
            Total {type === 'income' ? 'Income' : 'Expenses'} ({getTimeFilterLabel(timeFilter, customStartDate, customEndDate)})
          </p>
          <p className={cn(
            "text-3xl font-bold mt-1",
            type === 'income' ? "text-success" : "text-destructive"
          )}>
            {type === 'expense' ? '-' : '+'}{formatCurrency(total)}
          </p>
          
          <div className="h-24 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 10, right: 10 }}>
                <defs>
                  <linearGradient id={`${type}Gradient`} x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={type === 'income' ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                      stopOpacity={0.3} 
                    />
                    <stop 
                      offset="95%" 
                      stopColor={type === 'income' ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                      stopOpacity={0} 
                    />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  interval={0}
                  padding={{ left: 5, right: 5 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), type === 'income' ? 'Income' : 'Expense']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={type === 'income' ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                  strokeWidth={2}
                  fill={`url(#${type}Gradient)`}
                  dot={{ 
                    fill: type === 'income' ? "hsl(var(--success))" : "hsl(var(--destructive))", 
                    strokeWidth: 2, 
                    r: 3 
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      
      {/* Upcoming Recurring Banner */}
      <div className="px-4 mb-4">
        <UpcomingRecurringBanner type={type} />
      </div>
      
      {/* Search Button - Opens Global Search */}
      <div className="px-4 mb-4">
        <button
          onClick={onSearchClick}
          className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search size={18} />
          <span className="flex-1 text-left text-sm">Search transactions...</span>
          <kbd className="hidden md:inline-flex px-1.5 py-0.5 bg-background rounded text-xs font-mono">⌘K</kbd>
        </button>
      </div>
      
      {/* Category Chips */}
      <div className="px-4 mb-2 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => { setSelectedCategory(null); setUncategorizedFilter(null); }}
            className={cn(
              "px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors text-sm",
              !selectedCategory && !uncategorizedFilter
                ? "bg-foreground text-background" 
                : "bg-muted text-muted-foreground"
            )}
          >
            All
          </button>
          {filteredCategories.filter(c => c.name !== 'Not Specified').slice(0, 6).map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(selectedCategory === cat.id ? null : cat.id); setUncategorizedFilter(null); }}
              className={cn(
                "px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-2 text-sm",
                selectedCategory === cat.id 
                  ? "bg-foreground text-background" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
          <div className="w-px self-stretch my-1 bg-foreground/30 flex-shrink-0" />
          {[
            { key: 'no-category', label: 'No Category' },
            { key: 'no-project', label: 'No Project' },
            { key: 'no-vendor', label: 'No Vendor' },
            { key: 'no-partner', label: 'No Partner' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => { setUncategorizedFilter(uncategorizedFilter === filter.key ? null : filter.key); setSelectedCategory(null); }}
              className={cn(
                "px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors text-sm",
                uncategorizedFilter === filter.key 
                  ? "bg-foreground text-background" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Sort Dropdown */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
          </p>
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
      </div>

      {/* Transaction List */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)
        ) : isAmountSort ? (
          // Flat list for amount-based sorting
          sortedTransactions.length === 0 ? (
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground">No transactions found</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {sortedTransactions.map((t, index) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <TransactionItem
                    transaction={t}
                    category={categories.find(c => c.id === t.categoryId)}
                    userId={userId}
                    onEditSheetChange={onEditSheetChange}
                  />
                </motion.div>
              ))}
            </div>
          )
        ) : !groupedTransactions || groupedTransactions.length === 0 ? (
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No transactions found</p>
          </motion.div>
        ) : (
          groupedTransactions.map(([date, txns]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {formatDateLabel(date)}
              </p>
              <div className="space-y-2">
                {txns.map((t, index) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <TransactionItem
                      transaction={t}
                      category={categories.find(c => c.id === t.categoryId)}
                      userId={userId}
                      onEditSheetChange={onEditSheetChange}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

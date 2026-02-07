import { useMemo, useState } from "react";
import { Transaction, TransactionType } from "@/lib/types";
import { useFinanceStore } from "@/lib/store";
import { formatDate as formatDateLabel, formatCurrency } from "@/lib/constants";
import { TransactionItem } from "./TransactionItem";
import { TransactionSkeleton } from "./ui/skeleton-loader";
import { UpcomingRecurringBanner } from "./UpcomingRecurringBanner";
import { Search, CalendarIcon } from "lucide-react";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { format, differenceInDays, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
interface TransactionListProps {
  type: TransactionType;
  userId?: string;
  onEditSheetChange?: (isOpen: boolean) => void;
  onSearchClick?: () => void;
}

type TimeFilter = 'fy' | 'week' | 'month' | 'year' | 'custom';

export const TransactionList = ({ type, userId, onEditSheetChange, onSearchClick }: TransactionListProps) => {
  const { transactions, categories, getTotalIncome, getTotalExpense } = useFinanceStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('fy');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  
  const filteredCategories = categories.filter(c => c.type === type);
  
  const dateRange = useMemo(() => {
    const today = new Date();
    const start = new Date();
    
    switch (timeFilter) {
      case 'fy': {
        // Financial Year: April 1st to March 31st
        const currentMonth = today.getMonth(); // 0-11
        const currentYear = today.getFullYear();
        // If Jan-Mar (0-2), FY started previous year; Apr-Dec (3-11), FY started this year
        const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
        return {
          start: `${fyStartYear}-04-01`,
          end: `${fyStartYear + 1}-03-31`,
        };
      }
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: format(customStartDate, 'yyyy-MM-dd'),
            end: format(customEndDate, 'yyyy-MM-dd'),
          };
        }
        start.setMonth(today.getMonth() - 1);
        break;
      default:
        start.setMonth(today.getMonth() - 1);
    }
    
    // Use LOCAL date strings (not UTC via toISOString) to match our stored transaction.date format.
    // Using toISOString() causes off-by-one-day bugs for users in non-UTC timezones.
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(today, 'yyyy-MM-dd'),
    };
  }, [timeFilter, customStartDate, customEndDate]);
  
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === type)
      .filter(t => t.date >= dateRange.start && t.date <= dateRange.end)
      .filter(t => !selectedCategory || t.categoryId === selectedCategory);
  }, [transactions, type, dateRange, selectedCategory]);
  
  const total = type === 'income' 
    ? getTotalIncome(dateRange.start, dateRange.end)
    : getTotalExpense(dateRange.start, dateRange.end);
  
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTransactions]);
  
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
      <div className="p-4 pt-6 safe-top">
        <h1 className="text-2xl font-bold">
          {type === 'expense' ? 'Expenses' : 'Income'}
        </h1>
      </div>
      
      {/* Time Filter Tabs */}
      <div className="px-4 mb-4">
        <div className="flex p-1 bg-muted rounded-xl">
          {(['fy', 'week', 'month', 'year', 'custom'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                "flex-1 py-2 rounded-lg font-medium transition-colors capitalize text-sm",
                timeFilter === filter 
                  ? "bg-card shadow-sm" 
                  : "text-muted-foreground"
              )}
            >
              {filter === 'fy' ? 'FY' : filter === 'week' ? 'Week' : filter === 'month' ? 'Month' : filter === 'year' ? 'Year' : 'Custom'}
            </button>
          ))}
        </div>
        
        {/* Custom Date Range Picker */}
        {timeFilter === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex gap-2"
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !customStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customStartDate ? format(customStartDate, "MMM dd, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card z-[60]" align="start">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !customEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customEndDate ? format(customEndDate, "MMM dd, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card z-[60]" align="end">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </motion.div>
        )}
      </div>
      
      {/* Summary Card with Chart */}
      <div className="px-4 mb-4">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-card"
        >
          <p className="text-sm text-muted-foreground">
            Total {type === 'income' ? 'Income' : 'Expenses'} ({
              timeFilter === 'fy' ? (() => {
                const today = new Date();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();
                const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
                return `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
              })() :
              timeFilter === 'week' ? 'This Week' : 
              timeFilter === 'month' ? 'This Month' : 
              timeFilter === 'year' ? 'This Year' : 
              customStartDate && customEndDate ? `${format(customStartDate, 'MMM dd')} - ${format(customEndDate, 'MMM dd')}` : 'Custom'
            })
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
      <div className="px-4 mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors",
              !selectedCategory 
                ? "bg-foreground text-background" 
                : "bg-muted text-muted-foreground"
            )}
          >
            All
          </button>
          {filteredCategories.slice(0, 6).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={cn(
                "px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-2",
                selectedCategory === cat.id 
                  ? "bg-foreground text-background" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Transaction List */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)
        ) : groupedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          groupedTransactions.map(([date, txns]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {formatDateLabel(date)}
              </p>
              <div className="space-y-2">
                {txns.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    category={categories.find(c => c.id === t.categoryId)}
                    userId={userId}
                    onEditSheetChange={onEditSheetChange}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

import { useMemo, useState } from "react";
import { Transaction, TransactionType } from "@/lib/types";
import { useFinanceStore } from "@/lib/store";
import { formatDate as formatDateLabel, formatCurrency } from "@/lib/constants";
import { TransactionItem } from "./TransactionItem";
import { TransactionSkeleton } from "./ui/skeleton-loader";
import { Search, Filter } from "lucide-react";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";

interface TransactionListProps {
  type: TransactionType;
}

type TimeFilter = 'week' | 'month' | 'year' | 'custom';

export const TransactionList = ({ type }: TransactionListProps) => {
  const { transactions, categories, getTotalIncome, getTotalExpense } = useFinanceStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading] = useState(false);
  
  const filteredCategories = categories.filter(c => c.type === type);
  
  const dateRange = useMemo(() => {
    const today = new Date();
    const start = new Date();
    
    switch (timeFilter) {
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      default:
        start.setMonth(today.getMonth() - 1);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    };
  }, [timeFilter]);
  
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === type)
      .filter(t => t.date >= dateRange.start && t.date <= dateRange.end)
      .filter(t => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const category = categories.find(c => c.id === t.categoryId);
        return (
          t.vendor.toLowerCase().includes(query) ||
          t.notes?.toLowerCase().includes(query) ||
          category?.name.toLowerCase().includes(query)
        );
      })
      .filter(t => !selectedCategory || t.categoryId === selectedCategory);
  }, [transactions, type, dateRange, searchQuery, selectedCategory, categories]);
  
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
    const weeks: { name: string; value: number }[] = [];
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      
      const weekTransactions = filteredTransactions.filter((t) => {
        const date = new Date(t.date);
        return date >= weekStart && date <= weekEnd;
      });
      
      weeks.push({
        name: `Week ${4 - i}`,
        value: weekTransactions.reduce((sum, t) => sum + t.amount, 0),
      });
    }
    
    return weeks;
  }, [filteredTransactions]);
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 pt-6">
        <h1 className="text-2xl font-bold">
          {type === 'expense' ? 'Expenses' : 'Income'}
        </h1>
      </div>
      
      {/* Time Filter Tabs */}
      <div className="px-4 mb-4">
        <div className="flex p-1 bg-muted rounded-xl">
          {(['week', 'month', 'year'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                "flex-1 py-2 rounded-lg font-medium transition-colors capitalize",
                timeFilter === filter 
                  ? "bg-card shadow-sm" 
                  : "text-muted-foreground"
              )}
            >
              {filter === 'week' ? 'Weekly' : filter === 'month' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Summary Card with Chart */}
      <div className="px-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-card"
        >
          <p className="text-sm text-muted-foreground">
            Total {type === 'income' ? 'Income' : 'Expenses'} ({timeFilter === 'week' ? 'This Week' : timeFilter === 'month' ? 'This Month' : 'This Year'})
          </p>
          <p className={cn(
            "text-3xl font-bold mt-1",
            type === 'income' ? "text-success" : "text-destructive"
          )}>
            {type === 'expense' ? '-' : '+'}{formatCurrency(total)}
          </p>
          
          <div className="h-24 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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
      
      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendor or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Filter size={18} />
          </button>
        </div>
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

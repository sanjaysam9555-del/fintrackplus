import { useMemo, useState } from "react";
import { Transaction, TransactionType } from "@/lib/types";
import { useFinanceStore } from "@/lib/store";
import { formatDate as formatDateLabel, formatCurrency } from "@/lib/constants";
import { TransactionItem } from "./TransactionItem";
import { PageLoader } from "./ui/skeleton-loader";
import { UpcomingRecurringBanner } from "./UpcomingRecurringBanner";
import { ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { TransactionFilterSheet, TransactionFilters, emptyFilters, countActiveFilters } from "./TransactionFilterSheet";
import { doesHandledByBelongToPartner } from "@/lib/partnerIdentity";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { format, differenceInDays, parseISO } from "date-fns";
import { TimeFrameDropdown, computeDateRange, getTimeFilterLabel } from "./TimeFrameSelector";

interface TransactionListProps {
  type: TransactionType;
  userId?: string;
  isEmployee?: boolean;
  onEditSheetChange?: (isOpen: boolean) => void;
}

export const TransactionList = ({ type, userId, isEmployee = false, onEditSheetChange }: TransactionListProps) => {
  const { transactions, categories, vendors, partners, projects, projectLabels, getTotalIncome, getTotalExpense, activeTimeFilter, activeCustomStartDate, activeCustomEndDate, setActiveTimeFilter, setActiveCustomDateRange } = useFinanceStore();
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
  const [isLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [filters, setFilters] = useState<TransactionFilters>(emptyFilters);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const activeFilterCount = countActiveFilters(filters);

  const filteredCategories = categories.filter(c => c.type === type);
  const filteredVendors = useMemo(() => [...vendors].sort((a, b) => a.name.localeCompare(b.name)), [vendors]);
  const filteredProjects = useMemo(() => [...projects].filter(p => !p.archived).sort((a, b) => a.name.localeCompare(b.name)), [projects]);
  const filteredPartners = useMemo(() => [...partners].sort((a, b) => a.name.localeCompare(b.name)), [partners]);
  const filteredLabels = useMemo(() => [...projectLabels].sort((a, b) => a.name.localeCompare(b.name)), [projectLabels]);
  
  const dateRange = useMemo(() => {
    return computeDateRange(timeFilter, customStartDate, customEndDate);
  }, [timeFilter, customStartDate, customEndDate]);
  
  const filteredTransactions = useMemo(() => {
    const base = isEmployee
      ? transactions.filter(t => t.userId === userId)
      : transactions;
    return base
      .filter(t => t.type === type)
      .filter(t => t.date >= dateRange.start && t.date <= dateRange.end)
      .filter(t => filters.categoryIds.length === 0 || filters.categoryIds.includes(t.categoryId))
      .filter(t => filters.vendorNames.length === 0 || filters.vendorNames.includes(t.vendor))
      .filter(t => filters.paymentModes.length === 0 || filters.paymentModes.includes(t.paymentMethod))
      .filter(t => filters.partnerIds.length === 0 || filters.partnerIds.some(pid => doesHandledByBelongToPartner(partners.find(p => p.id === pid), t.handledBy)))
      .filter(t => filters.projectIds.length === 0 || (!!t.projectId && filters.projectIds.includes(t.projectId)))
      .filter(t => {
        if (filters.labelIds.length === 0) return true;
        const project = t.projectId ? projects.find(p => p.id === t.projectId) : undefined;
        return !!project?.labelIds?.some(lid => filters.labelIds.includes(lid));
      });
  }, [transactions, type, dateRange, filters, isEmployee, userId, partners, projects]);
  
  const total = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);
  
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
    
    if (timeFilter === 'all') {
      if (filteredTransactions.length === 0) return [];
      
      const txDates = filteredTransactions.map(t => parseISO(t.date).getTime());
      const earliestDate = new Date(Math.min(...txDates));
      const latestDate = new Date(Math.min(Math.max(...txDates), today.getTime()));
      const realDaysDiff = differenceInDays(latestDate, earliestDate);
      
      if (realDaysDiff <= 14) {
        for (let i = 0; i <= realDaysDiff; i++) {
          const day = new Date(earliestDate);
          day.setDate(earliestDate.getDate() + i);
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTxns = filteredTransactions.filter(t => t.date === dayStr);
          dataPoints.push({
            name: format(day, 'EEE'),
            value: dayTxns.reduce((sum, t) => sum + t.amount, 0),
          });
        }
      } else if (realDaysDiff <= 60) {
        const numWeeks = Math.ceil(realDaysDiff / 7);
        for (let i = 0; i < numWeeks; i++) {
          const weekStart = new Date(earliestDate);
          weekStart.setDate(earliestDate.getDate() + (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const clampedEnd = weekEnd > latestDate ? latestDate : weekEnd;
          
          const weekTxns = filteredTransactions.filter(t => {
            const d = parseISO(t.date);
            return d >= weekStart && d <= clampedEnd;
          });
          dataPoints.push({
            name: `W${i + 1}`,
            value: weekTxns.reduce((sum, t) => sum + t.amount, 0),
          });
        }
      } else {
        const useYearSuffix = realDaysDiff > 730;
        const current = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
        while (current <= latestDate) {
          const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
          const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
          const monthTxns = filteredTransactions.filter(t => {
            const d = parseISO(t.date);
            return d >= monthStart && d <= monthEnd;
          });
          dataPoints.push({
            name: format(monthStart, useYearSuffix ? "MMM ''yy" : 'MMM'),
            value: monthTxns.reduce((sum, t) => sum + t.amount, 0),
          });
          current.setMonth(current.getMonth() + 1);
        }
      }
      return dataPoints;
    }
    
    if (timeFilter === 'fy') {
      // Financial Year: Generate months from start to min(endDate, today)
      const actualEnd = endDate > today ? today : endDate;
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

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
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
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
        <TimeFrameDropdown
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
      
      {/* Upcoming Recurring Banner (Income only) */}
      {type === 'income' && (
        <div className="px-4 mb-4">
          <UpcomingRecurringBanner type={type} />
        </div>
      )}

      {/* Filters & Sort */}
      <div className="px-4 mb-2 flex items-center justify-between gap-2">
        <button
          onClick={() => setIsFilterSheetOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            activeFilterCount > 0 ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-auto h-auto gap-1.5 px-3 py-1.5 rounded-full border-none bg-muted text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors focus:ring-0 focus:ring-offset-0 [&>svg:last-child]:opacity-100 [&>svg:last-child]:h-3.5 [&>svg:last-child]:w-3.5">
            <ArrowUpDown size={14} className="text-muted-foreground shrink-0" />
            Sort
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

      {/* Result Count */}
      <div className="px-4 mb-3">
        <p className="text-sm font-medium text-muted-foreground">
          {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <TransactionFilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={sortedTransactions.length}
        categories={filteredCategories}
        vendors={filteredVendors}
        partners={filteredPartners}
        projectLabels={filteredLabels}
        projects={filteredProjects}
      />

      {/* Transaction List */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          <PageLoader />
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

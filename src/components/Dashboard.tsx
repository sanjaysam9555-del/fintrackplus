import { useMemo, useState, useRef, useCallback } from "react";
import { useFinanceStore } from "@/lib/store";
import { SummaryCard } from "./SummaryCard";
import { CashFlowChart } from "./CashFlowChart";
import { TransactionItem } from "./TransactionItem";
import { DashboardSkeleton } from "./ui/skeleton-loader";
import { InstallmentDueReminder } from "./InstallmentDueReminder";
import { PartnerBalanceCard } from "./PartnerBalanceCard";

import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { CalendarDays, Grid3X3, Store, ScrollText, FileBarChart, Settings, Sparkles, RefreshCw, Cloud, CloudOff, Loader2, WifiOff, Search, ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
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
  userId?: string;
  onSearchClick?: () => void;
  onEditSheetChange?: (isOpen: boolean) => void;
}

type TimeFilter = 'fy' | 'week' | 'month' | 'year' | 'custom';

export const Dashboard = ({ isLoading = false, onAddClick, onNavigate, onRefresh, isRefreshing, isOnline = true, pendingCount = 0, userId, onSearchClick, onEditSheetChange }: DashboardProps) => {
  const { transactions, categories, partners, getTotalIncome, getTotalExpense, userProfile, syncStatus, lastSyncedAt } = useFinanceStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('fy');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  // IMPORTANT: Both mobile + desktop header sections are mounted (one is CSS-hidden).
  // If they share the same popover open state, Radix can fail to anchor/render the visible popover.
  const [showDatePickerMobile, setShowDatePickerMobile] = useState(false);
  const [showDatePickerDesktop, setShowDatePickerDesktop] = useState(false);
  const [showCustomCalendar, setShowCustomCalendar] = useState<'start' | 'end' | null>(null);
  const [sortBy, setSortBy] = useState<string>('recent');

  const closeDatePicker = useCallback(() => {
    setShowDatePickerMobile(false);
    setShowDatePickerDesktop(false);
  }, []);
  
  const today = new Date();
  
  const dateRange = useMemo(() => {
    const todayDate = new Date();
    const start = new Date();
    
    switch (timeFilter) {
      case 'fy': {
        // Financial Year: April 1st to March 31st
        const currentMonth = todayDate.getMonth(); // 0-11
        const currentYear = todayDate.getFullYear();
        // If Jan-Mar (0-2), FY started previous year; Apr-Dec (3-11), FY started this year
        const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
        return {
          start: `${fyStartYear}-04-01`,
          end: `${fyStartYear + 1}-03-31`,
        };
      }
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
    
    // Use LOCAL date strings (not UTC) to match stored transaction.date format
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(todayDate, 'yyyy-MM-dd'),
    };
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
    const filtered = transactions
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
  }, [transactions, dateRange, sortBy]);
  
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);
  
  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'fy': {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
        return `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
      }
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
    <div className="min-h-screen pb-40 md:pb-8 md:px-6">
      {/* Header */}
      <div className="p-4 safe-top">
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Top row: Avatar + Name + Action Icons */}
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
            
            {/* Mobile action icons */}
            <div className="flex items-center">
              {onRefresh && (
                <button 
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <RefreshCw 
                    size={18} 
                    className={cn(
                      "text-muted-foreground",
                      isRefreshing && "animate-spin"
                    )} 
                  />
                </button>
              )}
              <Popover
                open={showDatePickerMobile}
                onOpenChange={(open) => {
                  setShowDatePickerMobile(open);
                  if (open) setShowDatePickerDesktop(false);
                }}
              >
                <PopoverTrigger asChild>
                  <button className="p-1.5 rounded-full hover:bg-muted transition-colors">
                    <CalendarDays size={18} className={cn(
                      "transition-colors",
                      showDatePickerMobile ? "text-primary" : "text-muted-foreground"
                    )} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3 bg-card z-[60] pointer-events-auto" align="end" sideOffset={8}>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Time Frame</p>
                    
                    {/* Quick Filters */}
                    <div className="flex gap-1">
                      {(['fy', 'week', 'month', 'year'] as TimeFilter[]).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => {
                            setTimeFilter(filter);
                            setShowCustomCalendar(null);
                            closeDatePicker();
                          }}
                          className={cn(
                            "flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                            timeFilter === filter && timeFilter !== 'custom'
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {filter === 'fy' ? 'FY' : filter === 'week' ? 'Week' : filter === 'month' ? 'Month' : 'Year'}
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
                                customStartDate ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"
                              )}
                            >
                              {customStartDate ? format(customStartDate, "MMM dd") : "From"}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-card z-[70] pointer-events-auto" align="start" side="bottom">
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
                                customEndDate ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"
                              )}
                            >
                              {customEndDate ? format(customEndDate, "MMM dd") : "To"}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-card z-[70] pointer-events-auto" align="end" side="bottom">
                            <Calendar
                              mode="single"
                              selected={customEndDate}
                              onSelect={(date) => {
                                setCustomEndDate(date);
                                if (date && customStartDate) {
                                  setTimeFilter('custom');
                                  closeDatePicker();
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
                          onClick={closeDatePicker}
                          className="w-full mt-2 px-2 py-1.5 bg-primary text-primary-foreground text-xs rounded-md font-medium"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {onSearchClick && (
                <button 
                  onClick={onSearchClick}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                  title="Search (⌘K)"
                >
                  <Search size={18} className="text-muted-foreground" />
                </button>
              )}
              <button 
                onClick={() => onNavigate?.('ai')}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <Sparkles size={18} className="text-muted-foreground" />
              </button>
              <button 
                onClick={() => onNavigate?.('settings')}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <Settings size={18} className="text-muted-foreground" />
              </button>
            </div>
          </div>
          
          {/* Bottom row: Time filter badge + Sync status */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2.5 flex items-center gap-2 flex-wrap"
          >
            <button
              type="button"
              onClick={() => setShowDatePickerMobile(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-accent text-accent-foreground text-xs font-medium rounded-full hover:bg-accent/80 transition-colors"
              aria-label="Choose time frame"
            >
              <CalendarDays size={12} />
              {getTimeFilterLabel()}
            </button>
            
            {/* Sync Status Chip */}
            {(!isOnline || syncStatus === 'syncing' || isRefreshing || syncStatus === 'error' || pendingCount > 0) && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing || !isOnline}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full transition-all",
                  !isOnline && "bg-amber-500/10 text-amber-600",
                  isOnline && (syncStatus === 'syncing' || isRefreshing) && "bg-muted text-muted-foreground",
                  isOnline && pendingCount > 0 && syncStatus !== 'syncing' && !isRefreshing && "bg-amber-500/10 text-amber-600",
                  isOnline && syncStatus === 'error' && pendingCount === 0 && "bg-destructive/10 text-destructive"
                )}
              >
                {!isOnline ? (
                  <>
                    <WifiOff size={10} />
                    Offline
                  </>
                ) : syncStatus === 'syncing' || isRefreshing ? (
                  <>
                    <Loader2 size={10} className="animate-spin" />
                    Syncing
                  </>
                ) : pendingCount > 0 ? (
                  <>
                    <Cloud size={10} />
                    {pendingCount} pending
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <CloudOff size={10} />
                    Error
                  </>
                ) : null}
              </button>
            )}
          </motion.div>
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
              {onRefresh && (
                <button 
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <RefreshCw 
                    size={18} 
                    className={cn(
                      "text-muted-foreground",
                      isRefreshing && "animate-spin"
                    )} 
                  />
                </button>
              )}
              <Popover
                open={showDatePickerDesktop}
                onOpenChange={(open) => {
                  setShowDatePickerDesktop(open);
                  if (open) setShowDatePickerMobile(false);
                }}
              >
                <PopoverTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-muted transition-colors">
                    <CalendarDays size={22} className={cn(
                      "transition-colors",
                      showDatePickerDesktop ? "text-primary" : "text-muted-foreground"
                    )} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3 bg-card z-[60] pointer-events-auto" align="end" sideOffset={8}>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Time Frame</p>
                    
                    {/* Quick Filters */}
                    <div className="flex gap-1">
                      {(['fy', 'week', 'month', 'year'] as TimeFilter[]).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => {
                            setTimeFilter(filter);
                            setShowCustomCalendar(null);
                            closeDatePicker();
                          }}
                          className={cn(
                            "flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                            timeFilter === filter && timeFilter !== 'custom'
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {filter === 'fy' ? 'FY' : filter === 'week' ? 'Week' : filter === 'month' ? 'Month' : 'Year'}
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
                                customStartDate ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"
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
                                customEndDate ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"
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
                                  closeDatePicker();
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
                          onClick={closeDatePicker}
                          className="w-full mt-2 px-2 py-1.5 bg-primary text-primary-foreground text-xs rounded-md font-medium"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {onSearchClick && (
                <button 
                  onClick={onSearchClick}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  title="Search (⌘K)"
                >
                  <Search size={22} className="text-muted-foreground" />
                </button>
              )}
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
          
          {/* Time Filter Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 flex-wrap"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent text-accent-foreground text-sm font-medium rounded-full">
              <CalendarDays size={14} />
              {getTimeFilterLabel()}
            </span>
            
            {/* Sync Status Chip */}
            {(!isOnline || syncStatus === 'syncing' || isRefreshing || syncStatus === 'error' || pendingCount > 0) && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing || !isOnline}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-all",
                  !isOnline && "bg-amber-500/10 text-amber-600",
                  isOnline && (syncStatus === 'syncing' || isRefreshing) && "bg-muted text-muted-foreground",
                  isOnline && pendingCount > 0 && syncStatus !== 'syncing' && !isRefreshing && "bg-amber-500/10 text-amber-600",
                  isOnline && syncStatus === 'error' && pendingCount === 0 && "bg-destructive/10 text-destructive"
                )}
              >
                {!isOnline ? (
                  <>
                    <WifiOff size={12} />
                    Offline
                  </>
                ) : syncStatus === 'syncing' || isRefreshing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Syncing
                  </>
                ) : pendingCount > 0 ? (
                  <>
                    <Cloud size={12} />
                    {pendingCount} pending
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <CloudOff size={12} />
                    Error
                  </>
                ) : null}
              </button>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Installment Due Reminders */}
      <div className="px-4 lg:px-0">
        <InstallmentDueReminder userId={userId} />
      </div>

      {/* Summary Cards - 3 Column Grid */}
      <div className="px-4 lg:px-0 mb-6">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 lg:gap-4"
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
        </motion.div>
        
        {/* Total Holdings Card - only when partners exist */}
        {partners.length > 0 && (
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 lg:mt-4"
          >
            <SummaryCard
              title="Total Holdings"
              amount={totalHoldings}
              type="holdings"
            />
          </motion.div>
        )}
      </div>
      
      {/* Partner Balance Breakdown */}
      {partners.length > 0 && (
        <div className="px-4 lg:px-0 mb-6">
          <PartnerBalanceCard dateRange={dateRange} />
        </div>
      )}
      
      {/* Cash Flow Chart */}
      <div className="px-4 lg:px-0 mb-6">
        <CashFlowChart 
          transactions={transactions.filter(t => t.date >= dateRange.start && t.date <= dateRange.end)} 
          timeFilter={timeFilter}
          dateRange={dateRange}
        />
      </div>
      
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
            { key: 'logs', icon: ScrollText, label: 'Logs', color: 'bg-amber-500/10', iconColor: 'text-amber-500 dark:text-amber-400' },
            { key: 'reports', icon: FileBarChart, label: 'Reports', color: 'bg-purple-500/10', iconColor: 'text-purple-500 dark:text-purple-400' },
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

import { useState, useMemo } from "react";
import { ArrowLeft, Download, FileText, CalendarDays } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReportsSectionProps {
  onBack: () => void;
}

type TimeFrame = 'week' | 'month' | 'year' | 'custom';

export const ReportsSection = ({ onBack }: ReportsSectionProps) => {
  const { transactions, categories, addNotification } = useFinanceStore();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const dateRange = useMemo(() => {
    const today = new Date();
    switch (timeFrame) {
      case 'week':
        return { start: subDays(today, 7), end: today };
      case 'month':
        return { start: startOfMonth(today), end: today };
      case 'year':
        return { start: startOfYear(today), end: today };
      case 'custom':
        return { start: startDate, end: endDate };
      default:
        return { start: startOfMonth(today), end: today };
    }
  }, [timeFrame, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    const start = format(dateRange.start, 'yyyy-MM-dd');
    const end = format(dateRange.end, 'yyyy-MM-dd');
    return transactions.filter(t => t.date >= start && t.date <= end);
  }, [transactions, dateRange]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export in this period");
      return;
    }

    const headers = ['Date', 'Time', 'Type', 'Vendor', 'Category', 'Amount', 'Payment Method', 'Notes'];
    const rows = filteredTransactions.map(t => {
      const category = categories.find(c => c.id === t.categoryId);
      return [
        t.date,
        t.time,
        t.type,
        t.vendor,
        category?.name || 'Other',
        t.amount.toString(),
        t.paymentMethod,
        t.notes || ''
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-${format(dateRange.start, 'yyyyMMdd')}-${format(dateRange.end, 'yyyyMMdd')}.csv`;
    a.click();

    addNotification({
      type: 'export',
      title: 'CSV Exported',
      message: `${filteredTransactions.length} transactions exported`,
    });
    toast.success('CSV exported successfully!');
  };

  const handleExportPDF = () => {
    toast.info('PDF export coming soon!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Reports</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Time Frame Selector */}
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm font-medium mb-3">Time Frame</p>
          <div className="flex gap-2 mb-3">
            {(['week', 'month', 'year'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                  timeFrame === tf
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  onClick={() => setTimeFrame('custom')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm border",
                    timeFrame === 'custom' ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  <CalendarDays size={14} />
                  {format(timeFrame === 'custom' ? startDate : dateRange.start, 'MMM dd')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(date);
                      setTimeFrame('custom');
                    }
                  }}
                  className="p-2"
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  onClick={() => setTimeFrame('custom')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm border",
                    timeFrame === 'custom' ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  <CalendarDays size={14} />
                  {format(timeFrame === 'custom' ? endDate : dateRange.end, 'MMM dd')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="end">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(date);
                      setTimeFrame('custom');
                    }
                  }}
                  disabled={(date) => date < startDate}
                  className="p-2"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm font-medium mb-3">Summary</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="text-lg font-bold text-success">₹{stats.income.toLocaleString()}</p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Expense</p>
              <p className="text-lg font-bold text-destructive">₹{stats.expense.toLocaleString()}</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={cn("text-lg font-bold", stats.balance >= 0 ? "text-success" : "text-destructive")}>
                ₹{stats.balance.toLocaleString()}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-lg font-bold">{stats.count}</p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Export Options</p>
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download size={18} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Export as CSV</p>
              <p className="text-sm text-muted-foreground">{stats.count} transactions</p>
            </div>
          </button>
          <button
            onClick={handleExportPDF}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FileText size={18} className="text-purple-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Export as PDF</p>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

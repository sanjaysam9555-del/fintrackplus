import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/constants";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

type TimeFilter = 'fy' | 'week' | 'month' | 'year' | 'all' | 'custom';

interface CashFlowChartProps {
  transactions: Transaction[];
  timeFilter: TimeFilter;
  dateRange: { start: string; end: string };
  onPointSelect?: (amount: number, label: string) => void;
}

interface ChartDataPoint {
  name: string;
  income: number;
  expense: number;
  net: number;
  date: string;
}

export const CashFlowChart = ({ transactions, timeFilter, dateRange, onPointSelect }: CashFlowChartProps) => {
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);
  
  const chartData = useMemo(() => {
    const today = new Date();
    const dataPoints: ChartDataPoint[] = [];
    
    // Helper to calculate income/expense for a date range
    const calcForRange = (rangeStart: Date, rangeEnd: Date): { income: number; expense: number } => {
      const rangeTxns = transactions.filter(t => {
        const d = parseISO(t.date);
        return d >= rangeStart && d <= rangeEnd;
      });
      return {
        income: rangeTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: rangeTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      };
    };

    // For "All Time", detect actual transaction boundaries
    if (timeFilter === 'all') {
      if (transactions.length === 0) return [];
      
      const txDates = transactions.map(t => parseISO(t.date).getTime());
      const earliestDate = new Date(Math.min(...txDates));
      const latestDate = new Date(Math.min(Math.max(...txDates), today.getTime()));
      const realDaysDiff = differenceInDays(latestDate, earliestDate);

      if (realDaysDiff <= 14) {
        // Daily
        for (let i = 0; i <= realDaysDiff; i++) {
          const day = new Date(earliestDate);
          day.setDate(earliestDate.getDate() + i);
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTxns = transactions.filter(t => t.date === dayStr);
          dataPoints.push({
            name: format(day, 'EEE'),
            income: dayTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
            expense: dayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
            net: 0, date: dayStr,
          });
        }
      } else if (realDaysDiff <= 60) {
        // Weekly
        const numWeeks = Math.ceil(realDaysDiff / 7);
        for (let i = 0; i < numWeeks; i++) {
          const wStart = new Date(earliestDate);
          wStart.setDate(earliestDate.getDate() + i * 7);
          const wEnd = new Date(wStart);
          wEnd.setDate(wStart.getDate() + 6);
          const clamped = wEnd > latestDate ? latestDate : wEnd;
          const { income, expense } = calcForRange(wStart, clamped);
          dataPoints.push({ name: `W${i + 1}`, income, expense, net: 0, date: format(wStart, 'yyyy-MM-dd') });
        }
      } else {
        // Monthly
        const useYear = realDaysDiff > 730;
        let current = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
        while (current <= latestDate) {
          const mStart = new Date(current.getFullYear(), current.getMonth(), 1);
          const mEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
          const { income, expense } = calcForRange(mStart, mEnd);
          dataPoints.push({
            name: useYear ? format(mStart, "MMM ''yy") : format(mStart, 'MMM'),
            income, expense, net: 0, date: format(mStart, 'yyyy-MM-dd'),
          });
          current.setMonth(current.getMonth() + 1);
        }
      }

      dataPoints.forEach(p => p.net = p.income - p.expense);
      return dataPoints;
    }

    // Parse as local dates to match stored transaction.date format
    const startDate = parseISO(dateRange.start);
    const endDate = parseISO(dateRange.end);
    const daysDiff = differenceInDays(endDate, startDate);

    if (timeFilter === 'fy') {
      // Financial Year: Generate months from start to min(endDate, today)
      const actualEnd = endDate > today ? today : endDate;
      let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      
      while (current <= actualEnd) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        
        const { income, expense } = calcForRange(monthStart, monthEnd);
        
        dataPoints.push({
          name: format(monthStart, 'MMM'),
          income,
          expense,
          net: income - expense,
          date: format(monthStart, 'yyyy-MM-dd'),
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
        const dayTransactions = transactions.filter(t => t.date === dayStr);
        const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        dataPoints.push({
          name: format(day, 'EEE'),
          income,
          expense,
          net: income - expense,
          date: dayStr,
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
        
        // Clamp to date range
        const clampedEnd = weekEnd > endDate ? endDate : weekEnd;
        
        const { income, expense } = calcForRange(weekStart, clampedEnd);
        
        dataPoints.push({
          name: `W${i + 1}`,
          income,
          expense,
          net: income - expense,
          date: format(weekStart, 'yyyy-MM-dd'),
        });
      }
    } else if (timeFilter === 'year' || daysDiff > 31) {
      // Show months within the exact date range
      let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const actualEnd = endDate > today ? today : endDate;
      
      while (current <= actualEnd) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        
        const { income, expense } = calcForRange(monthStart, monthEnd);
        
        dataPoints.push({
          name: format(monthStart, 'MMM'),
          income,
          expense,
          net: income - expense,
          date: format(monthStart, 'yyyy-MM-dd'),
        });
        
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      // Custom: determine based on days difference
      if (daysDiff <= 14) {
        // Show days within range
        for (let i = 0; i <= daysDiff; i++) {
          const day = new Date(startDate);
          day.setDate(startDate.getDate() + i);
          const dayStr = format(day, 'yyyy-MM-dd');
          
          const dayTransactions = transactions.filter(t => t.date === dayStr);
          const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
          
          dataPoints.push({
            name: format(day, 'd'),
            income,
            expense,
            net: income - expense,
            date: dayStr,
          });
        }
      } else {
        // Show weeks within range
        const numWeeks = Math.ceil(daysDiff / 7);
        for (let i = 0; i < numWeeks; i++) {
          const weekStart = new Date(startDate);
          weekStart.setDate(startDate.getDate() + (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const clampedEnd = weekEnd > endDate ? endDate : weekEnd;
          const { income, expense } = calcForRange(weekStart, clampedEnd);
          
          dataPoints.push({
            name: `W${i + 1}`,
            income,
            expense,
            net: income - expense,
            date: format(weekStart, 'yyyy-MM-dd'),
          });
        }
      }
    }
    
    return dataPoints;
  }, [transactions, timeFilter, dateRange]);
  
  const totalNet = chartData.reduce((sum, w) => sum + w.net, 0);
  const percentChange = useMemo(() => {
    if (chartData.length < 2) return 0;
    const current = chartData[chartData.length - 1].net;
    const previous = chartData[chartData.length - 2].net;
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }, [chartData]);
  
  const handleClick = (data: any) => {
    if (data?.activePayload?.[0]) {
      const point = data.activePayload[0].payload as ChartDataPoint;
      setSelectedPoint(point);
      onPointSelect?.(point.net, point.name);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-3 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm text-muted-foreground">Cash Flow Trend</p>
          <p className={cn("text-2xl font-bold", totalNet >= 0 ? "text-success" : "text-destructive")}>
            {totalNet < 0 ? '-' : ''}{formatCurrency(Math.abs(totalNet))}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          percentChange >= 0 ? 'bg-success-light text-success' : 'bg-destructive-light text-destructive'
        }`}>
          <TrendingUp size={12} />
          {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%
        </div>
      </div>
      
      {selectedPoint && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn("text-sm mb-2", selectedPoint.net >= 0 ? "text-success" : "text-destructive")}
        >
          {selectedPoint.name}: Net {selectedPoint.net < 0 ? '-' : ''}{formatCurrency(Math.abs(selectedPoint.net))}
        </motion.p>
      )}
      
      <div className="h-20 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} onClick={handleClick} margin={{ left: 10, right: 10 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
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
            <YAxis hide />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'income' ? 'Income' : 'Expense'
              ]}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fill="url(#incomeGradient)"
              dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: 'hsl(var(--success))', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              fill="url(#expenseGradient)"
              dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: 'hsl(var(--destructive))', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[10px] text-muted-foreground">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <span className="text-[10px] text-muted-foreground">Expense</span>
        </div>
      </div>
    </motion.div>
  );
};

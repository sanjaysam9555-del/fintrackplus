import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/constants";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface CashFlowChartProps {
  transactions: Transaction[];
  onPointSelect?: (amount: number, label: string) => void;
}

interface ChartDataPoint {
  name: string;
  income: number;
  expense: number;
  net: number;
  date: string;
}

export const CashFlowChart = ({ transactions, onPointSelect }: CashFlowChartProps) => {
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);
  
  const chartData = useMemo(() => {
    const today = new Date();
    const weeks: ChartDataPoint[] = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      
      const weekTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return date >= weekStart && date <= weekEnd;
      });
      
      const income = weekTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = weekTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      weeks.push({
        name: `W${4 - i}`,
        income,
        expense,
        net: income - expense,
        date: weekEnd.toISOString().split('T')[0],
      });
    }
    
    return weeks;
  }, [transactions]);
  
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
      className="bg-card rounded-2xl p-4 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm text-muted-foreground">Cash Flow Trend</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(Math.abs(totalNet))}
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
          className="text-sm text-muted-foreground mb-2"
        >
          {selectedPoint.name}: Net {formatCurrency(selectedPoint.net)}
        </motion.p>
      )}
      
      <div className="h-28 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} onClick={handleClick}>
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
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
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
              dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'hsl(var(--success))', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              fill="url(#expenseGradient)"
              dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'hsl(var(--destructive))', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center gap-4 mt-2">
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

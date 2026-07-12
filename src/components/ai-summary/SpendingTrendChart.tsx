import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthData {
  label: string;
  income: number;
  expense: number;
}

interface SpendingTrendChartProps {
  data: MonthData[];
}

const formatAmount = (amount: number): string => {
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toString();
};

export const SpendingTrendChart = ({ data }: SpendingTrendChartProps) => {
  // Calculate trend (compare last 2 months)
  const recentMonths = data.slice(-2);
  const expenseTrend = recentMonths.length === 2 && recentMonths[0].expense > 0
    ? ((recentMonths[1].expense - recentMonths[0].expense) / recentMonths[0].expense) * 100
    : 0;
    
  const trendUp = expenseTrend > 5;
  const trendDown = expenseTrend < -5;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value?: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
          <p className="text-xs font-medium mb-1">{label}</p>
          <p className="text-xs text-success">Income: ₹{payload[0]?.value?.toLocaleString()}</p>
          <p className="text-xs text-destructive">Expense: ₹{payload[1]?.value?.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">6-Month Trend</h3>
        {(trendUp || trendDown) && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trendUp ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
          )}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(expenseTrend).toFixed(0)}% {trendUp ? "up" : "down"}</span>
          </div>
        )}
      </div>
      
      <div className="h-40 md:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              hide 
              domain={[0, 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="income" radius={[4, 4, 0, 0]} maxBarSize={20}>
              {data.map((_, index) => (
                <Cell key={`income-${index}`} fill="hsl(var(--success))" opacity={0.8} />
              ))}
            </Bar>
            <Bar dataKey="expense" radius={[4, 4, 0, 0]} maxBarSize={20}>
              {data.map((_, index) => (
                <Cell key={`expense-${index}`} fill="hsl(var(--destructive))" opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-success" />
          <span className="text-xs text-muted-foreground">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-destructive" />
          <span className="text-xs text-muted-foreground">Expense</span>
        </div>
      </div>
    </motion.div>
  );
};

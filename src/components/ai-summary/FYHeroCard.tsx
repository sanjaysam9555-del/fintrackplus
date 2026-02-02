import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

interface FYHeroCardProps {
  fyLabel: string;
  totalIncome: number;
  totalExpense: number;
  lastFYIncome?: number;
  lastFYExpense?: number;
}

const formatAmount = (amount: number): string => {
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
};

const getChangePercent = (current: number, previous: number): number | null => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

const ChangeIndicator = ({ change }: { change: number | null }) => {
  if (change === null) return null;
  
  const isPositive = change > 0;
  const isZero = Math.abs(change) < 0.5;
  
  if (isZero) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus size={12} />
        <span>0%</span>
      </span>
    );
  }
  
  return (
    <span className={cn(
      "flex items-center gap-0.5 text-xs font-medium",
      isPositive ? "text-success" : "text-destructive"
    )}>
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      <span>{isPositive ? "+" : ""}{change.toFixed(0)}%</span>
    </span>
  );
};

export const FYHeroCard = ({ 
  fyLabel, 
  totalIncome, 
  totalExpense,
  lastFYIncome,
  lastFYExpense
}: FYHeroCardProps) => {
  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  
  const incomeChange = getChangePercent(totalIncome, lastFYIncome || 0);
  const expenseChange = getChangePercent(totalExpense, lastFYExpense || 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 backdrop-blur-sm"
    >
      <h2 className="text-lg font-semibold mb-4">{fyLabel} Overview</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total Income */}
        <div className="bg-success/10 border border-success/20 rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Total Income</p>
          <div className="flex items-center gap-1">
            <IndianRupee size={16} className="text-success" />
            <span className="text-xl font-bold text-success">{formatAmount(totalIncome)}</span>
          </div>
          <ChangeIndicator change={incomeChange} />
        </div>
        
        {/* Total Expense */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
          <div className="flex items-center gap-1">
            <IndianRupee size={16} className="text-destructive" />
            <span className="text-xl font-bold text-destructive">{formatAmount(totalExpense)}</span>
          </div>
          <ChangeIndicator change={expenseChange} />
        </div>
      </div>
      
      {/* Net Profit & Margin */}
      <div className="flex items-center justify-between pt-3 border-t border-primary/20">
        <div>
          <p className="text-xs text-muted-foreground">Net Profit</p>
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-lg font-bold",
              netProfit >= 0 ? "text-success" : "text-destructive"
            )}>
              {netProfit >= 0 ? "+" : ""}₹{formatAmount(Math.abs(netProfit))}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Profit Margin</p>
          <span className={cn(
            "text-lg font-bold",
            profitMargin >= 30 ? "text-success" : profitMargin >= 10 ? "text-warning" : "text-destructive"
          )}>
            {profitMargin.toFixed(0)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

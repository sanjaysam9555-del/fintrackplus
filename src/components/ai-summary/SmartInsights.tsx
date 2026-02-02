import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'negative' | 'neutral';
  icon: LucideIcon;
  title: string;
  description: string;
  metric?: string;
}

interface SmartInsightsProps {
  insights: Insight[];
}

const getInsightStyles = (type: string) => {
  switch (type) {
    case 'positive':
      return {
        container: 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
        icon: 'bg-emerald-500/20 text-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
      };
    case 'warning':
      return {
        container: 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/20',
        icon: 'bg-amber-500/20 text-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
      };
    case 'negative':
      return {
        container: 'bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/20',
        icon: 'bg-red-500/20 text-red-500',
        text: 'text-red-600 dark:text-red-400',
      };
    default:
      return {
        container: 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20',
        icon: 'bg-primary/20 text-primary',
        text: 'text-primary',
      };
  }
};

export const SmartInsights = ({ insights }: SmartInsightsProps) => {
  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb size={18} className="text-primary" />
        <h3 className="font-semibold">Smart Insights</h3>
      </div>
      
      {insights.map((insight, index) => {
        const styles = getInsightStyles(insight.type);
        const Icon = insight.icon;
        
        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className={cn(
              "p-4 rounded-xl border backdrop-blur-sm",
              styles.container
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", styles.icon)}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("font-medium text-sm", styles.text)}>{insight.title}</p>
                  {insight.metric && (
                    <span className={cn("text-sm font-bold", styles.text)}>{insight.metric}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// Helper to generate insights from data
export const generateInsights = ({
  currentMonthExpense,
  lastMonthExpense,
  last3MonthAvgExpense,
  profitMargin,
  topVendorPercent,
  topVendorName,
  topCategoryName,
  topCategoryChange,
  dailyAverage,
  fyIncome,
}: {
  currentMonthExpense: number;
  lastMonthExpense: number;
  last3MonthAvgExpense: number;
  profitMargin: number;
  topVendorPercent: number;
  topVendorName: string;
  topCategoryName: string;
  topCategoryChange: number;
  dailyAverage: number;
  fyIncome: number;
}): Insight[] => {
  const insights: Insight[] = [];
  
  // Month-over-month spending
  if (lastMonthExpense > 0) {
    const momChange = ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
    if (Math.abs(momChange) > 10) {
      insights.push({
        id: 'mom-spending',
        type: momChange > 0 ? 'warning' : 'positive',
        icon: momChange > 0 ? TrendingUp : TrendingDown,
        title: momChange > 0 ? 'Spending Up This Month' : 'Spending Down This Month',
        description: momChange > 0 
          ? `You're spending ${Math.abs(momChange).toFixed(0)}% more than last month. Review recent expenses.`
          : `Great job! You've reduced spending by ${Math.abs(momChange).toFixed(0)}% compared to last month.`,
        metric: `${momChange > 0 ? '+' : ''}${momChange.toFixed(0)}%`,
      });
    }
  }
  
  // Profit margin insight
  if (fyIncome > 0) {
    if (profitMargin >= 40) {
      insights.push({
        id: 'profit-margin',
        type: 'positive',
        icon: CheckCircle,
        title: 'Excellent Profit Margin',
        description: `At ${profitMargin.toFixed(0)}% margin, you're keeping most of your income. Well managed!`,
        metric: `${profitMargin.toFixed(0)}%`,
      });
    } else if (profitMargin < 15 && profitMargin >= 0) {
      insights.push({
        id: 'profit-margin',
        type: 'warning',
        icon: AlertTriangle,
        title: 'Low Profit Margin',
        description: `Your margin is only ${profitMargin.toFixed(0)}%. Consider reducing expenses to improve savings.`,
        metric: `${profitMargin.toFixed(0)}%`,
      });
    } else if (profitMargin < 0) {
      insights.push({
        id: 'profit-margin',
        type: 'negative',
        icon: AlertTriangle,
        title: 'Negative Cash Flow',
        description: 'You\'re spending more than you\'re earning. Time to review your budget.',
        metric: `${profitMargin.toFixed(0)}%`,
      });
    }
  }
  
  // Vendor concentration
  if (topVendorPercent > 40 && topVendorName) {
    insights.push({
      id: 'vendor-concentration',
      type: 'neutral',
      icon: Target,
      title: 'High Vendor Concentration',
      description: `${topVendorPercent.toFixed(0)}% of expenses go to ${topVendorName}. Consider diversifying or negotiating better rates.`,
      metric: `${topVendorPercent.toFixed(0)}%`,
    });
  }
  
  // Category trend
  if (topCategoryName && Math.abs(topCategoryChange) > 20) {
    insights.push({
      id: 'category-trend',
      type: topCategoryChange > 0 ? 'warning' : 'positive',
      icon: Zap,
      title: `${topCategoryName} ${topCategoryChange > 0 ? 'Surge' : 'Drop'}`,
      description: topCategoryChange > 0
        ? `${topCategoryName} spending is up ${Math.abs(topCategoryChange).toFixed(0)}% vs 3-month average.`
        : `${topCategoryName} spending dropped ${Math.abs(topCategoryChange).toFixed(0)}% vs 3-month average.`,
      metric: `${topCategoryChange > 0 ? '+' : ''}${topCategoryChange.toFixed(0)}%`,
    });
  }
  
  // Daily spending pace
  if (dailyAverage > 0 && fyIncome > 0) {
    const projectedMonthly = dailyAverage * 30;
    const monthlyIncomeAvg = fyIncome / 12;
    const pacePercent = (projectedMonthly / monthlyIncomeAvg) * 100;
    
    if (pacePercent > 100) {
      insights.push({
        id: 'spending-pace',
        type: 'negative',
        icon: TrendingUp,
        title: 'Spending Pace Alert',
        description: `At ₹${dailyAverage.toLocaleString()}/day, you'll exceed your average monthly income.`,
        metric: `₹${dailyAverage.toLocaleString()}/day`,
      });
    }
  }
  
  return insights.slice(0, 4); // Limit to 4 insights
};

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Lightbulb, PiggyBank, Target, ArrowLeft } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { format, subDays, startOfMonth } from "date-fns";

interface AISummaryPageProps {
  onBack?: () => void;
}

export const AISummaryPage = ({ onBack }: AISummaryPageProps) => {
  const { transactions, categories, projects, getTotalIncome, getTotalExpense } = useFinanceStore();
  
  const insights = useMemo(() => {
    const today = new Date();
    const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');
    const lastWeekStart = format(subDays(today, 7), 'yyyy-MM-dd');
    
    const monthIncome = getTotalIncome(monthStart, todayStr);
    const monthExpense = getTotalExpense(monthStart, todayStr);
    const weekExpense = getTotalExpense(lastWeekStart, todayStr);
    const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0;
    
    // Category spending analysis
    const categorySpending = transactions
      .filter(t => t.type === 'expense' && t.date >= monthStart)
      .reduce((acc, t) => {
        acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)[0];
    const topCategoryName = topCategory 
      ? categories.find(c => c.id === topCategory[0])?.name || 'Unknown'
      : null;
    
    // Vendor frequency
    const vendorCounts = transactions
      .filter(t => t.type === 'expense' && t.date >= monthStart)
      .reduce((acc, t) => {
        acc[t.vendor] = (acc[t.vendor] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const topVendor = Object.entries(vendorCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    const result = [];
    
    // Savings insight
    if (savingsRate > 20) {
      result.push({
        type: 'positive',
        icon: PiggyBank,
        title: 'Great Savings!',
        description: `You're saving ${savingsRate.toFixed(0)}% of your income this month. Keep it up!`,
      });
    } else if (savingsRate < 10 && monthIncome > 0) {
      result.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Low Savings Rate',
        description: `Your savings rate is only ${savingsRate.toFixed(0)}%. Consider reducing expenses.`,
      });
    }
    
    // Top spending category
    if (topCategory && topCategory[1] > 0) {
      result.push({
        type: 'neutral',
        icon: Target,
        title: 'Top Spending Category',
        description: `${topCategoryName} accounts for ₹${topCategory[1].toLocaleString()} this month.`,
      });
    }
    
    // Weekly spending trend
    const dailyAverage = weekExpense / 7;
    result.push({
      type: dailyAverage * 30 > monthIncome ? 'negative' : 'positive',
      icon: dailyAverage * 30 > monthIncome ? TrendingUp : TrendingDown,
      title: 'Daily Average',
      description: `You're spending ₹${dailyAverage.toFixed(0)} per day on average.`,
    });
    
    // Top vendor insight
    if (topVendor) {
      result.push({
        type: 'neutral',
        icon: Lightbulb,
        title: 'Frequent Vendor',
        description: `You've made ${topVendor[1]} transactions at ${topVendor[0]} this month.`,
      });
    }
    
    // Project budget alerts
    projects.forEach(project => {
      const spent = transactions
        .filter(t => t.projectId === project.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      if (project.budgetLimit > 0 && spent > project.budgetLimit * 0.8) {
        result.push({
          type: spent > project.budgetLimit ? 'negative' : 'warning',
          icon: AlertCircle,
          title: `${project.name} Budget Alert`,
          description: spent > project.budgetLimit 
            ? `Over budget by ₹${(spent - project.budgetLimit).toLocaleString()}`
            : `${((spent / project.budgetLimit) * 100).toFixed(0)}% of budget used`,
        });
      }
    });
    
    return result;
  }, [transactions, categories, projects, getTotalIncome, getTotalExpense]);
  
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-success/10 border-success/20 text-success';
      case 'negative':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      default:
        return 'bg-primary/10 border-primary/20 text-primary';
    }
  };
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 pt-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Summary</h1>
            <p className="text-sm text-muted-foreground">Smart insights from your spending</p>
          </div>
        </div>
      </div>
      
      <div className="px-4 space-y-3">
        {insights.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Sparkles size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No insights yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add more transactions to get AI-powered insights
            </p>
          </div>
        ) : (
          insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border ${getTypeStyles(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">{insight.title}</p>
                    <p className="text-sm opacity-80 mt-0.5">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: insights.length * 0.05 }}
          className="mt-6 p-4 rounded-xl bg-card border border-border"
        >
          <h3 className="font-semibold mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Total Transactions</p>
              <p className="text-xl font-bold">{transactions.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Categories Used</p>
              <p className="text-xl font-bold">
                {new Set(transactions.map(t => t.categoryId)).size}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Unique Vendors</p>
              <p className="text-xl font-bold">
                {new Set(transactions.map(t => t.vendor)).size}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Active Projects</p>
              <p className="text-xl font-bold">{projects.length}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

import { useMemo } from "react";
import { useFinanceStore } from "@/lib/store";
import { SummaryCard } from "./SummaryCard";
import { CashFlowChart } from "./CashFlowChart";
import { TransactionItem } from "./TransactionItem";
import { DashboardSkeleton } from "./ui/skeleton-loader";
import { motion } from "framer-motion";
import { Bell, CalendarDays } from "lucide-react";
import avatarImage from "@/assets/avatar-swati.jpg";

interface DashboardProps {
  isLoading?: boolean;
}

export const Dashboard = ({ isLoading = false }: DashboardProps) => {
  const { transactions, categories, getTotalIncome, getTotalExpense } = useFinanceStore();
  
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = today.toISOString().split('T')[0];
  
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
  
  const currentIncome = getTotalIncome(monthStart, monthEnd);
  const currentExpense = getTotalExpense(monthStart, monthEnd);
  const lastMonthIncome = getTotalIncome(lastMonthStart, lastMonthEnd);
  const lastMonthExpense = getTotalExpense(lastMonthStart, lastMonthEnd);
  
  const incomeChange = lastMonthIncome > 0 
    ? ((currentIncome - lastMonthIncome) / lastMonthIncome) * 100 
    : 0;
  const expenseChange = lastMonthExpense > 0 
    ? ((currentExpense - lastMonthExpense) / lastMonthExpense) * 100 
    : 0;
  
  const netBalance = currentIncome - currentExpense;
  
  const recentTransactions = useMemo(() => {
    return transactions
      .slice()
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      })
      .slice(0, 5);
  }, [transactions]);
  
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary"
            >
              <img 
                src={avatarImage} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div>
              <p className="text-sm text-muted-foreground">{greeting},</p>
              <h1 className="text-lg font-bold">Swati Sharma</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <CalendarDays size={22} className="text-muted-foreground" />
            </button>
            <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
              <Bell size={22} className="text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Summary Cards - 3 Column Grid */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <SummaryCard
            title="Income"
            amount={currentIncome}
            type="income"
            percentChange={incomeChange}
          />
          <SummaryCard
            title="Expense"
            amount={currentExpense}
            type="expense"
            percentChange={expenseChange}
          />
          <SummaryCard
            title="Balance"
            amount={netBalance}
            type="balance"
          />
        </motion.div>
      </div>
      
      {/* Cash Flow Chart */}
      <div className="px-4 mb-6">
        <CashFlowChart transactions={transactions} />
      </div>
      
      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-3"
        >
          {[
            { icon: "➕", label: "Add New" },
            { icon: "↔️", label: "Transfer" },
            { icon: "📷", label: "Scan" },
            { icon: "⋯", label: "More" },
          ].map((action, i) => (
            <button
              key={i}
              className="flex flex-col items-center gap-2 p-3 bg-card rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
            >
              <span className="text-xl">{action.icon}</span>
              <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
            </button>
          ))}
        </motion.div>
      </div>
      
      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Recent Transactions</h2>
          <button className="text-sm text-primary font-medium">See All</button>
        </div>
        
        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-xl">
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tap + to add your first transaction
              </p>
            </div>
          ) : (
            recentTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TransactionItem
                  transaction={transaction}
                  category={categories.find(c => c.id === transaction.categoryId)}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

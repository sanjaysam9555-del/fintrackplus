import { Transaction, Category } from "@/lib/types";
import { formatCurrency, formatTime } from "@/lib/constants";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onClick?: () => void;
}

export const TransactionItem = ({ transaction, category, onClick }: TransactionItemProps) => {
  const isExpense = transaction.type === 'expense';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-card rounded-xl shadow-card cursor-pointer hover:shadow-card-hover transition-shadow"
    >
      <CategoryIcon 
        iconName={category?.icon || 'Circle'} 
        colorClass={category?.color || 'category-other'} 
      />
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">
          {transaction.vendor}
        </p>
        <p className="text-sm text-muted-foreground">
          {category?.name || 'Other'} • {formatTime(transaction.time)}
        </p>
      </div>
      
      <p className={cn(
        "font-bold text-right",
        isExpense ? "text-destructive" : "text-success"
      )}>
        {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
      </p>
    </motion.div>
  );
};

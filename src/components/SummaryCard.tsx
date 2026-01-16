import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'balance';
  percentChange?: number;
  className?: string;
}

const iconMap = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  balance: Wallet,
};

const colorMap = {
  income: {
    icon: "bg-success-light",
    iconColor: "text-success",
    text: "text-success",
  },
  expense: {
    icon: "bg-destructive-light",
    iconColor: "text-destructive",
    text: "text-destructive",
  },
  balance: {
    icon: "bg-primary-light",
    iconColor: "text-primary",
    text: "text-foreground",
  },
};

export const SummaryCard = ({ 
  title, 
  amount, 
  type, 
  percentChange, 
  className 
}: SummaryCardProps) => {
  const Icon = iconMap[type];
  const colors = colorMap[type];
  const isPositive = percentChange && percentChange > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "bg-card rounded-2xl p-3 lg:p-4 shadow-card border border-border",
        className
      )}
    >
      <div className={cn("w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center mb-2", colors.icon)}>
        <Icon size={16} className={cn(colors.iconColor, "lg:hidden")} />
        <Icon size={20} className={cn(colors.iconColor, "hidden lg:block")} />
      </div>
      
      <p className="text-xs lg:text-sm text-muted-foreground font-medium mb-1">{title}</p>
      
      <p className={cn("text-sm lg:text-lg font-bold truncate", colors.text)}>
        {type === 'expense' ? '-' : ''}{formatCurrency(amount)}
      </p>
      
      {percentChange !== undefined && (
        <p className={cn(
          "text-[10px] lg:text-xs font-medium mt-1 whitespace-nowrap",
          isPositive ? "text-success" : "text-destructive"
        )}>
          {isPositive ? '+' : ''}{percentChange.toFixed(1)}% vs last
        </p>
      )}
    </motion.div>
  );
};

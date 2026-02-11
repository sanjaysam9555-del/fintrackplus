import { cn } from "@/lib/utils";
import { formatCurrency, formatCompactCurrency } from "@/lib/constants";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

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

const AnimatedNumber = ({ value, prefix, formatter }: { value: number; prefix?: string; formatter: (v: number) => string }) => {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 30, stiffness: 100 });
  const display = useTransform(spring, (v) => `${prefix || ''}${formatter(Math.abs(Math.round(v)))}`);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span>{display}</motion.span>;
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
        "bg-card rounded-2xl p-2.5 lg:p-3 shadow-card border border-border",
        className
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div className={cn("w-6 h-6 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center flex-shrink-0", colors.icon)}>
          <Icon size={14} className={cn(colors.iconColor, "lg:hidden")} />
          <Icon size={16} className={cn(colors.iconColor, "hidden lg:block")} />
        </div>
        <p className="text-xs lg:text-sm text-muted-foreground font-medium truncate">{title}</p>
      </div>
      
      {/* Mobile: compact format, Desktop: full format */}
      <p className={cn("text-sm lg:text-lg font-bold truncate", colors.text)}>
        <span className="lg:hidden">
          <AnimatedNumber value={amount} prefix={type === 'expense' ? '-' : ''} formatter={formatCompactCurrency} />
        </span>
        <span className="hidden lg:inline">
          <AnimatedNumber value={amount} prefix={type === 'expense' ? '-' : ''} formatter={formatCurrency} />
        </span>
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

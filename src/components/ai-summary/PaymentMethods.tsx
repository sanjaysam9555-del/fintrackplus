import { motion } from "framer-motion";
import { Wallet, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethodsProps {
  cashTotal: number;
  onlineTotal: number;
}

const formatAmount = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString()}`;
};

export const PaymentMethods = ({ cashTotal, onlineTotal }: PaymentMethodsProps) => {
  const total = cashTotal + onlineTotal;
  
  if (total === 0) return null;
  
  const cashPercent = (cashTotal / total) * 100;
  const onlinePercent = (onlineTotal / total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Wallet size={18} className="text-primary" />
        <h3 className="font-semibold">Payment Methods</h3>
      </div>
      
      <div className="space-y-4">
        {/* Cash */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Wallet size={14} className="text-emerald-500" />
              </div>
              <span className="text-sm font-medium">Cash</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold">{formatAmount(cashTotal)}</span>
              <span className="text-xs text-muted-foreground ml-2">{cashPercent.toFixed(0)}%</span>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${cashPercent}%` }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="h-full rounded-full bg-emerald-500"
            />
          </div>
        </div>
        
        {/* Online */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Smartphone size={14} className="text-primary" />
              </div>
              <span className="text-sm font-medium">Online</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold">{formatAmount(onlineTotal)}</span>
              <span className="text-xs text-muted-foreground ml-2">{onlinePercent.toFixed(0)}%</span>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${onlinePercent}%` }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

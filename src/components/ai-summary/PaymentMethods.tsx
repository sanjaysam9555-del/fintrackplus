import { motion } from "framer-motion";
import { Wallet, Smartphone, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PaymentMethodsProps {
  expenseCash: number;
  expenseOnline: number;
  incomeCash: number;
  incomeOnline: number;
}

const formatAmount = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString()}`;
};

interface BarProps {
  label: string;
  icon: React.ReactNode;
  amount: number;
  percent: number;
  barClass: string;
  delay: number;
}

const PaymentMethodBar = ({ label, icon, amount, percent, barClass, delay }: BarProps) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-bold">{formatAmount(amount)}</span>
        <span className="text-xs text-muted-foreground ml-2">{percent.toFixed(0)}%</span>
      </div>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.5, delay }}
        className={`h-full rounded-full ${barClass}`}
      />
    </div>
  </div>
);

export const PaymentMethods = ({ expenseCash, expenseOnline, incomeCash, incomeOnline }: PaymentMethodsProps) => {
  const expenseTotal = expenseCash + expenseOnline;
  const incomeTotal = incomeCash + incomeOnline;

  if (expenseTotal === 0 && incomeTotal === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Wallet size={18} className="text-accent-foreground" />
        <h3 className="font-semibold">Payment Methods</h3>
      </div>

      <div className="space-y-4">
        {expenseTotal > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <ArrowUpRight size={14} className="text-destructive" />
              <span className="text-xs font-semibold uppercase tracking-wide text-destructive">Outgoing</span>
            </div>
            <div className="space-y-3">
              <PaymentMethodBar
                label="Cash"
                icon={<Wallet size={14} className="text-muted-foreground" />}
                amount={expenseCash}
                percent={(expenseCash / expenseTotal) * 100}
                barClass="bg-destructive"
                delay={0.45}
              />
              <PaymentMethodBar
                label="Online"
                icon={<Smartphone size={14} className="text-muted-foreground" />}
                amount={expenseOnline}
                percent={(expenseOnline / expenseTotal) * 100}
                barClass="bg-destructive/70"
                delay={0.5}
              />
            </div>
          </div>
        )}

        {expenseTotal > 0 && incomeTotal > 0 && <Separator />}

        {incomeTotal > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <ArrowDownLeft size={14} className="text-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Incoming</span>
            </div>
            <div className="space-y-3">
              <PaymentMethodBar
                label="Cash"
                icon={<Wallet size={14} className="text-muted-foreground" />}
                amount={incomeCash}
                percent={(incomeCash / incomeTotal) * 100}
                barClass="bg-emerald-500"
                delay={0.55}
              />
              <PaymentMethodBar
                label="Online"
                icon={<Smartphone size={14} className="text-muted-foreground" />}
                amount={incomeOnline}
                percent={(incomeOnline / incomeTotal) * 100}
                barClass="bg-emerald-500/70"
                delay={0.6}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

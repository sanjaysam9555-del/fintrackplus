import { motion } from "framer-motion";
import {
  Brain,
  Lightbulb,
  Droplets,
  TrendingUp,
  Users,
  UserCheck,
  Skull,
  Receipt,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DeepInsight {
  title: string;
  category:
    | "liquidity"
    | "profitability"
    | "vendor_concentration"
    | "partner_specialization"
    | "dead_money"
    | "gst_compliance"
    | "seasonality";
  severity: "info" | "warning" | "critical";
  body: string;
  actionable_tip: string;
}

interface DeepInsightsProps {
  insights: DeepInsight[];
  isLoading: boolean;
  error: string | null;
  hasData: boolean;
}

const categoryIcon: Record<DeepInsight["category"], React.ElementType> = {
  liquidity: Droplets,
  profitability: TrendingUp,
  vendor_concentration: Users,
  partner_specialization: UserCheck,
  dead_money: Skull,
  gst_compliance: Receipt,
  seasonality: CalendarClock,
};

const categoryLabel: Record<DeepInsight["category"], string> = {
  liquidity: "Liquidity",
  profitability: "Profitability",
  vendor_concentration: "Vendors",
  partner_specialization: "Partners",
  dead_money: "Dead Money",
  gst_compliance: "GST",
  seasonality: "Seasonality",
};

const getSeverityStyles = (severity: DeepInsight["severity"]) => {
  switch (severity) {
    case "critical":
      return {
        container: "bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/20",
        icon: "bg-red-500/20 text-red-500",
        title: "text-red-600 dark:text-red-400",
      };
    case "warning":
      return {
        container: "bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/20",
        icon: "bg-amber-500/20 text-amber-500",
        title: "text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        container: "bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
        icon: "bg-emerald-500/20 text-emerald-500",
        title: "text-emerald-600 dark:text-emerald-400",
      };
  }
};

function InsightCard({ insight, index }: { insight: DeepInsight; index: number }) {
  const Icon = categoryIcon[insight.category];
  const styles = getSeverityStyles(insight.severity);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("p-4 rounded-xl border backdrop-blur-sm", styles.container)}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", styles.icon)}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <p className={cn("font-medium text-sm", styles.title)}>{insight.title}</p>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {categoryLabel[insight.category]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {insight.body}
          </p>
          <p className="text-xs font-medium text-primary/80 leading-relaxed flex items-start gap-1.5">
            <Lightbulb size={12} className="shrink-0 mt-0.5" />
            <span>{insight.actionable_tip}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-xl border bg-muted/10">
          <div className="flex items-start gap-3">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        </div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-2.5 py-3"
      >
        <div className="relative">
          <Sparkles size={16} className="text-primary" />
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles size={16} className="text-primary" />
          </motion.div>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Analyzing your financial patterns…
        </p>
      </motion.div>
    </div>
  );
}

export function DeepInsights({ insights, isLoading, error, hasData }: DeepInsightsProps) {
  if (!hasData) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Brain size={16} className="text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-[17px]">Deep Insights</h2>
            <Badge className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-0 font-semibold">
              AI
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-powered analysis of your financial patterns
          </p>
        </div>
      </div>

      {isLoading && insights.length === 0 && <LoadingSkeleton />}

      {error && !isLoading && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center space-y-1">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <p className="text-xs text-muted-foreground">Insights will retry on your next visit.</p>
        </div>
      )}

      {!isLoading && insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <InsightCard key={`${insight.category}-${i}`} insight={insight} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

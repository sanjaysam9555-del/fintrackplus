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
  ArrowRight,
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

const categoryConfig: Record<
  DeepInsight["category"],
  { label: string; icon: React.ElementType; gradient: string; iconBg: string }
> = {
  liquidity: {
    label: "Liquidity",
    icon: Droplets,
    gradient: "from-blue-500/10 to-cyan-500/5",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  profitability: {
    label: "Profitability",
    icon: TrendingUp,
    gradient: "from-emerald-500/10 to-green-500/5",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  vendor_concentration: {
    label: "Vendors",
    icon: Users,
    gradient: "from-orange-500/10 to-amber-500/5",
    iconBg: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  },
  partner_specialization: {
    label: "Partners",
    icon: UserCheck,
    gradient: "from-violet-500/10 to-purple-500/5",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  dead_money: {
    label: "Dead Money",
    icon: Skull,
    gradient: "from-red-500/10 to-rose-500/5",
    iconBg: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  gst_compliance: {
    label: "GST",
    icon: Receipt,
    gradient: "from-amber-500/10 to-yellow-500/5",
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  seasonality: {
    label: "Seasonality",
    icon: CalendarClock,
    gradient: "from-cyan-500/10 to-sky-500/5",
    iconBg: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  },
};

const severityDot: Record<DeepInsight["severity"], string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

const severityLabel: Record<DeepInsight["severity"], string> = {
  info: "Observation",
  warning: "Needs Attention",
  critical: "Action Required",
};

function InsightCard({ insight, index }: { insight: DeepInsight; index: number }) {
  const cat = categoryConfig[insight.category];
  const CatIcon = cat.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative rounded-2xl border bg-card overflow-hidden",
        "hover:shadow-md transition-shadow duration-300"
      )}
    >
      {/* Category gradient header strip */}
      <div className={cn("bg-gradient-to-r h-1", cat.gradient.replace("/10", "/40").replace("/5", "/20"))} />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Top row: icon + category + severity */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cat.iconBg)}>
              <CatIcon size={18} />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {cat.label}
              </span>
              <h3 className="font-bold text-base sm:text-[17px] leading-tight text-foreground mt-0.5">
                {insight.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-1">
            <span className={cn("w-2 h-2 rounded-full", severityDot[insight.severity])} />
            <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              {severityLabel[insight.severity]}
            </span>
          </div>
        </div>

        {/* Body text */}
        <div className="text-[13.5px] sm:text-sm text-muted-foreground leading-[1.7] whitespace-pre-line">
          {insight.body}
        </div>

        {/* Actionable tip — prominent callout */}
        <div className={cn(
          "relative rounded-xl p-4 overflow-hidden",
          "bg-gradient-to-br", cat.gradient
        )}>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb size={14} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/70 mb-1 block">
                What to do
              </span>
              <p className="text-[13px] sm:text-[13.5px] font-medium text-foreground leading-relaxed">
                {insight.actionable_tip}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border bg-card overflow-hidden">
          <div className="h-1 bg-muted/40" />
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-3/4" />
              </div>
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
            <div className="rounded-xl bg-muted/20 p-4 space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-3.5 w-5/6" />
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

export function DeepInsights({
  insights,
  isLoading,
  error,
  hasData,
}: DeepInsightsProps) {
  if (!hasData) return null;

  return (
    <div className="space-y-5">
      {/* Section header */}
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

      {/* Loading */}
      {isLoading && insights.length === 0 && <LoadingSkeleton />}

      {/* Error */}
      {error && !isLoading && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-2">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <p className="text-xs text-muted-foreground">Insights will retry on your next visit.</p>
        </div>
      )}

      {/* Cards */}
      {!isLoading && insights.length > 0 && (
        <div className="space-y-4">
          {insights.map((insight, i) => (
            <InsightCard key={`${insight.category}-${i}`} insight={insight} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

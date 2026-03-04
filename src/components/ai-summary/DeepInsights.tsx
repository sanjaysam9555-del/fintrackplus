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
import { Button } from "@/components/ui/button";
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
  { label: string; icon: React.ElementType }
> = {
  liquidity: { label: "Liquidity", icon: Droplets },
  profitability: { label: "Profitability", icon: TrendingUp },
  vendor_concentration: { label: "Vendors", icon: Users },
  partner_specialization: { label: "Partners", icon: UserCheck },
  dead_money: { label: "Dead Money", icon: Skull },
  gst_compliance: { label: "GST", icon: Receipt },
  seasonality: { label: "Seasonality", icon: CalendarClock },
};

const severityConfig: Record<
  DeepInsight["severity"],
  { label: string; borderColor: string; badgeClass: string }
> = {
  info: {
    label: "Info",
    borderColor: "border-l-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  warning: {
    label: "Warning",
    borderColor: "border-l-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  critical: {
    label: "Critical",
    borderColor: "border-l-red-500",
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

function InsightCard({ insight, index }: { insight: DeepInsight; index: number }) {
  const cat = categoryConfig[insight.category];
  const sev = severityConfig[insight.severity];
  const CatIcon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={cn(
        "rounded-xl border border-l-4 bg-card overflow-hidden",
        sev.borderColor
      )}
    >
      <div className="p-4 sm:p-5 space-y-3">
        {/* Header: category + severity */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[11px] px-2 py-0.5 gap-1 font-medium">
            <CatIcon size={11} />
            {cat.label}
          </Badge>
          <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", sev.badgeClass)}>
            {sev.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[15px] sm:text-base leading-snug text-foreground">
          {insight.title}
        </h3>

        {/* Body — always visible */}
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {insight.body}
        </p>

        {/* Actionable tip callout */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-primary/5 border border-primary/10">
          <Lightbulb size={15} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-primary leading-relaxed">
            {insight.actionable_tip}
          </p>
        </div>
      </div>
    </motion.div>
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
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Brain size={18} className="text-primary" />
        <h2 className="font-semibold text-base">Deep Insights</h2>
        <Badge variant="secondary" className="text-[10px]">AI</Badge>
      </div>

      {/* Loading skeleton */}
      {isLoading && insights.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-l-4 border-l-muted bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="rounded-lg bg-muted/30 p-3">
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center gap-2 py-2">
            <Sparkles size={14} className="text-primary animate-pulse" />
            <p className="text-xs text-muted-foreground">
              Analyzing your financial patterns…
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">Insights will retry on your next visit.</p>
        </div>
      )}

      {/* Insight cards — always expanded */}
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

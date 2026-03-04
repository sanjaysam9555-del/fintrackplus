import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  Info,
  AlertCircle,
  Lightbulb,
  Droplets,
  TrendingUp,
  Users,
  UserCheck,
  Skull,
  Receipt,
  CalendarClock,
  ChevronDown,
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
  onGenerate: () => void;
  onRegenerate: () => void;
  hasData: boolean;
}

const categoryConfig: Record<
  DeepInsight["category"],
  { label: string; icon: React.ElementType; color: string }
> = {
  liquidity: { label: "Liquidity", icon: Droplets, color: "text-blue-500" },
  profitability: { label: "Profitability", icon: TrendingUp, color: "text-emerald-500" },
  vendor_concentration: { label: "Vendors", icon: Users, color: "text-orange-500" },
  partner_specialization: { label: "Partners", icon: UserCheck, color: "text-violet-500" },
  dead_money: { label: "Dead Money", icon: Skull, color: "text-red-500" },
  gst_compliance: { label: "GST", icon: Receipt, color: "text-amber-500" },
  seasonality: { label: "Seasonality", icon: CalendarClock, color: "text-cyan-500" },
};

const severityConfig: Record<
  DeepInsight["severity"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  critical: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

function InsightCard({ insight, index }: { insight: DeepInsight; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cat = categoryConfig[insight.category];
  const sev = severityConfig[insight.severity];
  const CatIcon = cat.icon;
  const SevIcon = sev.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border bg-card overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className={cn("mt-0.5 p-1.5 rounded-lg shrink-0", sev.bg)}>
          <SevIcon size={16} className={sev.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
              <CatIcon size={10} className={cat.color} />
              {cat.label}
            </Badge>
          </div>
          <h3 className="font-semibold text-sm leading-snug">{insight.title}</h3>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 mt-1 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-4"
        >
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {insight.body}
          </p>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Lightbulb size={14} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-primary">
              {insight.actionable_tip}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function DeepInsights({
  insights,
  isLoading,
  error,
  onGenerate,
  onRegenerate,
  hasData,
}: DeepInsightsProps) {
  if (!hasData) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-primary" />
          <h2 className="font-semibold text-base">Deep Insights</h2>
          <Badge variant="secondary" className="text-[10px]">AI</Badge>
        </div>
        {insights.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={isLoading}
            className="h-7 text-xs gap-1"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-center">
            Analyzing your financial data…
          </p>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={onGenerate} className="text-xs">
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !error && insights.length === 0 && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onGenerate}
          className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles size={20} className="text-primary" />
          </div>
          <p className="font-medium text-sm">Generate Deep Insights</p>
          <p className="text-xs text-muted-foreground">
            AI will analyze your financial patterns
          </p>
        </motion.button>
      )}

      {!isLoading && insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <InsightCard key={`${insight.category}-${i}`} insight={insight} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

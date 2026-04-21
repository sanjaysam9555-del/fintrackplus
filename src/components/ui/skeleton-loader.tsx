import { cn } from "@/lib/utils";
import appIcon from "@/assets/app-icon.png";

interface SkeletonProps {
  className?: string;
}

/**
 * Centered branded loading spinner.
 * Replaces all in-app placeholder skeletons with a single, consistent
 * "page is loading" animation across landing + app screens.
 */
export const PageLoader = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-4 w-full min-h-[40vh] py-12 animate-fade-in",
      className,
    )}
    role="status"
    aria-label="Loading"
  >
    <div className="relative">
      <img
        src={appIcon}
        alt=""
        aria-hidden
        className="w-12 h-12 rounded-2xl shadow-lg opacity-90"
      />
      <div className="absolute -inset-2 rounded-2xl border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
      Loading
    </p>
  </div>
);

// Backwards-compatible aliases — every previous skeleton now renders the
// same centered branded loader so we never show empty placeholder containers.
export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("skeleton", className)} />
);
export const TransactionSkeleton = () => <PageLoader />;
export const CardSkeleton = () => <PageLoader />;
export const ChartSkeleton = () => <PageLoader />;
export const DashboardSkeleton = () => <PageLoader className="min-h-[60vh]" />;

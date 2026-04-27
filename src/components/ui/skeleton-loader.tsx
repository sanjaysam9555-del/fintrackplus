import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import appIcon from "@/assets/spinner-logo.png";

interface SkeletonProps {
  className?: string;
}

/**
 * Centered branded loading spinner.
 *
 * Has a 150ms mount delay: if the consumer unmounts the loader within that
 * window (the common case for fast loads / brief refetches) the spinner
 * never reaches the screen. Prevents sub-second flashes that read as
 * "screen flickering".
 */
export const PageLoader = ({ className }: { className?: string }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 150);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) {
    // Reserve layout space so the page doesn't jump if/when the loader appears.
    return <div className={cn("w-full min-h-[40vh]", className)} aria-hidden />;
  }

  return (
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
          className="w-12 h-12 rounded-full shadow-lg opacity-90"
        />
        <div className="absolute -inset-2 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
        Loading
      </p>
    </div>
  );
};

// Backwards-compatible aliases — every previous skeleton now renders the
// same centered branded loader so we never show empty placeholder containers.
export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("skeleton", className)} />
);
export const TransactionSkeleton = () => <PageLoader />;
export const CardSkeleton = () => <PageLoader />;
export const ChartSkeleton = () => <PageLoader />;
export const DashboardSkeleton = () => <PageLoader className="min-h-[60vh]" />;

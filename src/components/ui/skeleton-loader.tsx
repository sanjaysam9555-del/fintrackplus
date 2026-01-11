import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("skeleton", className)} />
);

export const TransactionSkeleton = () => (
  <div className="flex items-center gap-3 p-4">
    <Skeleton className="w-10 h-10 rounded-xl" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
    <Skeleton className="h-5 w-16" />
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-8 w-28" />
    <Skeleton className="h-3 w-16" />
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-card rounded-2xl p-4 shadow-card space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-5 w-16" />
    </div>
    <Skeleton className="h-40 w-full rounded-xl" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 p-4 animate-fade-in">
    {/* Header */}
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
    
    {/* Summary Cards */}
    <div className="grid grid-cols-3 gap-3">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
    
    {/* Chart */}
    <ChartSkeleton />
    
    {/* Transactions */}
    <div className="space-y-2">
      <Skeleton className="h-5 w-32" />
      {[1, 2, 3, 4].map((i) => (
        <TransactionSkeleton key={i} />
      ))}
    </div>
  </div>
);

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Project } from "@/lib/types";
import { ProjectDetailSheet } from "./ProjectDetailSheet";
import { cn } from "@/lib/utils";

interface ProjectOverviewPageProps {
  userId?: string;
}

type HealthStatus = 'healthy' | 'at-risk' | 'critical';

const getHealthStatus = (actualMargin: number, expectedMargin: number): HealthStatus => {
  if (expectedMargin <= 0) return 'healthy';
  const healthPercent = (actualMargin / expectedMargin) * 100;
  if (healthPercent >= 100) return 'healthy';
  if (healthPercent >= 50) return 'at-risk';
  return 'critical';
};

const getHealthColor = (status: HealthStatus): string => {
  switch (status) {
    case 'healthy': return 'text-green-500';
    case 'at-risk': return 'text-yellow-500';
    case 'critical': return 'text-red-500';
  }
};

const getHealthBgColor = (status: HealthStatus): string => {
  switch (status) {
    case 'healthy': return 'bg-green-500/10';
    case 'at-risk': return 'bg-yellow-500/10';
    case 'critical': return 'bg-red-500/10';
  }
};

const getHealthIcon = (status: HealthStatus) => {
  switch (status) {
    case 'healthy': return CheckCircle2;
    case 'at-risk': return AlertTriangle;
    case 'critical': return TrendingDown;
  }
};

export const ProjectOverviewPage = ({ userId }: ProjectOverviewPageProps) => {
  const { projects, getProjectSpending, transactions } = useFinanceStore();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Calculate totals
  const totalBudget = projects.reduce((sum, p) => sum + p.budgetLimit, 0);
  const totalMargin = projects.reduce((sum, p) => sum + (p.margin || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + getProjectSpending(p.id), 0);

  // Get transactions for a project
  const getProjectTransactions = (projectId: string) => {
    return transactions.filter(t => t.projectId === projectId && t.type === 'expense');
  };

  // Get vendor breakdown for a project
  const getVendorBreakdown = (projectId: string) => {
    const projectTransactions = getProjectTransactions(projectId);
    const vendorMap = new Map<string, { amount: number; count: number; lastDate: string }>();
    
    projectTransactions.forEach(t => {
      const existing = vendorMap.get(t.vendor);
      if (existing) {
        existing.amount += t.amount;
        existing.count += 1;
        if (t.date > existing.lastDate) existing.lastDate = t.date;
      } else {
        vendorMap.set(t.vendor, { amount: t.amount, count: 1, lastDate: t.date });
      }
    });

    return Array.from(vendorMap.entries())
      .map(([vendor, data]) => ({ vendor, ...data }))
      .sort((a, b) => b.amount - a.amount);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 p-4 border-b border-border">
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">Track project budgets and margins</p>
      </div>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-xs text-muted-foreground">Total Budget</p>
          <p className="text-lg font-bold mt-1">₹{totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-xs text-muted-foreground">Total Spent</p>
          <p className="text-lg font-bold mt-1">₹{totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-xs text-muted-foreground">Exp. Margin</p>
          <p className="text-lg font-bold mt-1">₹{totalMargin.toLocaleString()}</p>
        </div>
      </div>

      {/* Project Cards */}
      <div className="p-4 space-y-3">
        {projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderKanban size={48} className="mx-auto mb-3 opacity-50" />
            <p>No projects yet</p>
            <p className="text-sm">Add projects from Settings</p>
          </div>
        ) : (
          <AnimatePresence>
            {projects.map((project) => {
              const spent = getProjectSpending(project.id);
              const actualMargin = project.budgetLimit - spent;
              const expectedMargin = project.margin || 0;
              const healthStatus = getHealthStatus(actualMargin, expectedMargin);
              const HealthIcon = getHealthIcon(healthStatus);
              const budgetPercent = project.budgetLimit > 0 ? (spent / project.budgetLimit) * 100 : 0;
              const transactionCount = getProjectTransactions(project.id).length;

              return (
                <motion.button
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => setSelectedProject(project)}
                  className="w-full bg-card rounded-2xl border border-border p-4 text-left hover:border-primary/50 transition-colors"
                >
                  {/* Header Row */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <FolderKanban size={22} style={{ color: project.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{project.name}</p>
                        <div className={cn("p-1 rounded-full", getHealthBgColor(healthStatus))}>
                          <HealthIcon size={14} className={getHealthColor(healthStatus)} />
                        </div>
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Budget Progress */}
                  {project.budgetLimit > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">
                          ₹{spent.toLocaleString()} spent
                        </span>
                        <span className="text-muted-foreground">
                          ₹{project.budgetLimit.toLocaleString()} budget
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(budgetPercent, 100)}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: budgetPercent > 100 ? '#EF4444' : project.color,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="mt-4 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      {actualMargin >= expectedMargin ? (
                        <TrendingUp size={14} className="text-green-500" />
                      ) : (
                        <TrendingDown size={14} className="text-red-500" />
                      )}
                      <span className={actualMargin >= expectedMargin ? "text-green-500" : "text-red-500"}>
                        ₹{actualMargin.toLocaleString()} margin
                      </span>
                    </div>
                    {expectedMargin > 0 && (
                      <span className="text-muted-foreground">
                        / ₹{expectedMargin.toLocaleString()} expected
                      </span>
                    )}
                    <span className="text-muted-foreground ml-auto">
                      {transactionCount} payment{transactionCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Project Detail Sheet */}
      <ProjectDetailSheet
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        spent={selectedProject ? getProjectSpending(selectedProject.id) : 0}
        transactions={selectedProject ? getProjectTransactions(selectedProject.id) : []}
        vendorBreakdown={selectedProject ? getVendorBreakdown(selectedProject.id) : []}
      />
    </div>
  );
};

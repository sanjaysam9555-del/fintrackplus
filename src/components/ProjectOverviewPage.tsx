import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
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

const getHealthBorderColor = (status: HealthStatus): string => {
  switch (status) {
    case 'healthy': return 'border-l-green-500';
    case 'at-risk': return 'border-l-yellow-500';
    case 'critical': return 'border-l-red-500';
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
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
        <h1 className="text-xl font-bold">Projects</h1>
      </div>

      {/* Summary Section */}
      <div className="px-4 pt-4">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="p-4 text-center">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Budget</p>
              <p className="text-base font-bold mt-1">₹{totalBudget.toLocaleString()}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Spent</p>
              <p className="text-base font-bold mt-1">₹{totalSpent.toLocaleString()}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Margin</p>
              <p className="text-base font-bold mt-1">₹{totalMargin.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {projects.length} Project{projects.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Project Cards */}
      <div className="px-4 space-y-3">
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FolderKanban size={28} className="text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add projects from Settings</p>
          </div>
        ) : (
          <AnimatePresence>
            {projects.map((project) => {
              const spent = getProjectSpending(project.id);
              const remaining = project.budgetLimit - spent;
              const actualMargin = project.budgetLimit - spent;
              const expectedMargin = project.margin || 0;
              const healthStatus = getHealthStatus(actualMargin, expectedMargin);
              const budgetPercent = project.budgetLimit > 0 ? Math.min((spent / project.budgetLimit) * 100, 100) : 0;
              const transactionCount = getProjectTransactions(project.id).length;

              return (
                <motion.button
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onClick={() => setSelectedProject(project)}
                  className={cn(
                    "w-full bg-card rounded-xl border border-border p-4 text-left",
                    "hover:bg-accent/50 transition-colors",
                    "border-l-4",
                    getHealthBorderColor(healthStatus)
                  )}
                >
                  {/* Top Row: Icon, Name, Arrow */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${project.color}15` }}
                    >
                      <FolderKanban size={18} style={{ color: project.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                  </div>

                  {/* Progress Bar */}
                  {project.budgetLimit > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${budgetPercent}%`,
                            backgroundColor: budgetPercent > 90 ? '#EF4444' : project.color,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Spent</p>
                        <p className="text-xs font-medium">₹{spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Budget</p>
                        <p className="text-xs font-medium">₹{project.budgetLimit.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Margin</p>
                        <div className="flex items-center gap-1">
                          {actualMargin >= expectedMargin ? (
                            <TrendingUp size={10} className="text-green-500" />
                          ) : (
                            <TrendingDown size={10} className="text-red-500" />
                          )}
                          <p className={cn(
                            "text-xs font-medium",
                            actualMargin >= expectedMargin ? "text-green-600" : "text-red-600"
                          )}>
                            ₹{actualMargin.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {transactionCount} txn{transactionCount !== 1 ? 's' : ''}
                    </p>
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

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, TrendingUp, TrendingDown, ChevronRight, Archive, ArchiveRestore } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Project } from "@/lib/types";
import { ProjectDetailSheet } from "./ProjectDetailSheet";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { toast } from "sonner";

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
  const { projects, getProjectSpending, transactions, updateProject } = useFinanceStore();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Filter projects
  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);
  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  // Calculate totals (only for active projects)
  const totalBudget = activeProjects.reduce((sum, p) => sum + p.budgetLimit, 0);
  const totalMargin = activeProjects.reduce((sum, p) => sum + (p.margin || 0), 0);
  const totalSpent = activeProjects.reduce((sum, p) => sum + getProjectSpending(p.id), 0);

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

  const handleArchiveToggle = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    updateProject(project.id, { archived: !project.archived }, userId);
    toast.success(project.archived ? 'Project restored' : 'Project archived');
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
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Budget</p>
              <p className="text-sm font-bold mt-0.5">₹{totalBudget.toLocaleString()}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Spent</p>
              <p className="text-sm font-bold mt-0.5">₹{totalSpent.toLocaleString()}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Margin</p>
              <p className="text-sm font-bold mt-0.5">₹{totalMargin.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Tabs */}
      <div className="px-4 pt-4 flex gap-2">
        <Button
          variant={!showArchived ? "default" : "outline"}
          size="sm"
          onClick={() => setShowArchived(false)}
          className="flex-1"
        >
          Active ({activeProjects.length})
        </Button>
        <Button
          variant={showArchived ? "default" : "outline"}
          size="sm"
          onClick={() => setShowArchived(true)}
          className="flex-1"
        >
          <Archive size={14} className="mr-1.5" />
          Archived ({archivedProjects.length})
        </Button>
      </div>

      {/* Project Cards - Two Column Grid */}
      <div className="px-4 pt-4 pb-4">
        {displayedProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              {showArchived ? <Archive size={24} className="text-muted-foreground" /> : <FolderKanban size={24} className="text-muted-foreground" />}
            </div>
            <p className="font-medium text-sm">
              {showArchived ? 'No archived projects' : 'No active projects'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {showArchived ? 'Archived projects will appear here' : 'Add projects from Settings'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {displayedProjects.map((project) => {
                const spent = getProjectSpending(project.id);
                const actualMargin = project.budgetLimit - spent;
                const expectedMargin = project.margin || 0;
                const healthStatus = getHealthStatus(actualMargin, expectedMargin);
                const budgetPercent = project.budgetLimit > 0 ? Math.min((spent / project.budgetLimit) * 100, 100) : 0;

                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "bg-card rounded-xl border border-border overflow-hidden",
                      "border-l-4",
                      project.archived ? "border-l-muted-foreground opacity-70" : getHealthBorderColor(healthStatus)
                    )}
                  >
                    {/* Card Content - Clickable */}
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="w-full p-3 text-left hover:bg-accent/50 transition-colors"
                    >
                      {/* Icon & Name */}
                      <div className="flex items-start gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${project.color}15` }}
                        >
                          <FolderKanban size={14} style={{ color: project.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{project.name}</p>
                          {project.description && (
                            <p className="text-[10px] text-muted-foreground truncate">{project.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {project.budgetLimit > 0 && (
                        <div className="mt-2">
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
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

                      {/* Stats */}
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-muted-foreground">Spent</span>
                          <span className="text-[10px] font-medium">₹{spent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-muted-foreground">Margin</span>
                          <span className={cn(
                            "text-[10px] font-medium flex items-center gap-0.5",
                            actualMargin >= expectedMargin ? "text-green-600" : "text-red-600"
                          )}>
                            {actualMargin >= expectedMargin ? (
                              <TrendingUp size={8} />
                            ) : (
                              <TrendingDown size={8} />
                            )}
                            ₹{actualMargin.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Archive Button */}
                    <div className="px-3 pb-2">
                      <button
                        onClick={(e) => handleArchiveToggle(e, project)}
                        className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        {project.archived ? (
                          <>
                            <ArchiveRestore size={12} />
                            Restore
                          </>
                        ) : (
                          <>
                            <Archive size={12} />
                            Archive
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
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

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, TrendingUp, TrendingDown, Archive, ArchiveRestore, Wallet, PiggyBank, Receipt, Search, MoreVertical, Copy, Trash2 } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Project } from "@/lib/types";
import { ProjectDetailSheet } from "./ProjectDetailSheet";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
interface ProjectOverviewPageProps {
  userId?: string;
  onEditSheetChange?: (isOpen: boolean) => void;
  onSearchClick?: () => void;
}

type HealthStatus = 'healthy' | 'at-risk' | 'critical';

const getHealthStatus = (actualMargin: number, expectedMargin: number): HealthStatus => {
  if (expectedMargin <= 0) return 'healthy';
  const healthPercent = (actualMargin / expectedMargin) * 100;
  if (healthPercent >= 100) return 'healthy';
  if (healthPercent >= 50) return 'at-risk';
  return 'critical';
};

const getHealthGradient = (status: HealthStatus): string => {
  switch (status) {
    case 'healthy': return 'from-green-500/20 to-green-500/5';
    case 'at-risk': return 'from-yellow-500/20 to-yellow-500/5';
    case 'critical': return 'from-red-500/20 to-red-500/5';
  }
};

const getHealthDot = (status: HealthStatus): string => {
  switch (status) {
    case 'healthy': return 'bg-green-500';
    case 'at-risk': return 'bg-yellow-500';
    case 'critical': return 'bg-red-500';
  }
};

export const ProjectOverviewPage = ({ userId, onEditSheetChange, onSearchClick }: ProjectOverviewPageProps) => {
  const { projects, getProjectSpending, getProjectIncome, transactions, updateProject, deleteProject } = useFinanceStore();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveProject, setArchiveProject] = useState<Project | null>(null);
  const [deleteProjectState, setDeleteProjectState] = useState<Project | null>(null);

  // Filter projects
  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);
  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  // Calculate totals based on selected tab
  const relevantProjects = showArchived ? archivedProjects : activeProjects;
  const totalBudget = relevantProjects.reduce((sum, p) => sum + p.budgetLimit, 0);
  const totalMargin = relevantProjects.reduce((sum, p) => sum + (p.margin || 0), 0);
  const totalSpent = relevantProjects.reduce((sum, p) => sum + getProjectSpending(p.id), 0);

  // Handle project duplication
  const handleDuplicate = (project: Project) => {
    const { addProject } = useFinanceStore.getState();
    addProject({
      name: `${project.name} (Copy)`,
      description: project.description,
      notes: project.notes,
      budgetLimit: project.budgetLimit,
      margin: project.margin || 0,
      color: project.color,
    }, userId);
    toast.success(`Project "${project.name}" duplicated`);
  };
  // Get ALL transactions for a project (not just expenses)
  const getProjectTransactions = (projectId: string) => {
    return transactions.filter(t => t.projectId === projectId);
  };

  // Get vendor breakdown for a project (expenses only for vendor payments)
  const getVendorBreakdown = (projectId: string) => {
    const projectTransactions = transactions.filter(t => t.projectId === projectId && t.type === 'expense');
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

  const handleArchiveConfirm = () => {
    if (archiveProject) {
      updateProject(archiveProject.id, { archived: !archiveProject.archived }, userId);
      toast.success(archiveProject.archived ? 'Project restored' : 'Project archived');
      setArchiveProject(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteProjectState) {
      deleteProject(deleteProjectState.id, userId);
      toast.success(`Project "${deleteProjectState.name}" deleted`);
      setDeleteProjectState(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-8 md:px-6">
      {/* Enhanced Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderKanban size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Projects</h1>
            <p className="text-xs text-muted-foreground">Track project financials</p>
          </div>
          <button 
            onClick={onSearchClick}
            className="p-2.5 rounded-full hover:bg-muted transition-colors"
            title="Search (⌘K)"
          >
            <Search size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Enhanced Summary Section */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{showArchived ? 'Archived' : 'Active'} Portfolio</p>
          </div>
          {/* Stats Grid */}
          <div className="grid grid-cols-3 divide-x divide-primary/10">
            <div className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <Wallet size={18} className="text-primary" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Budget</p>
              <p className="text-base font-bold">₹{totalBudget.toLocaleString()}</p>
            </div>
            <div className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mx-auto mb-2">
                <Receipt size={18} className="text-orange-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Spent</p>
              <p className="text-base font-bold">₹{totalSpent.toLocaleString()}</p>
            </div>
            <div className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                <PiggyBank size={18} className="text-green-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Margin</p>
              <p className="text-base font-bold">₹{totalMargin.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Toggle Tabs */}
      <div className="px-4 pt-4">
        <div className="flex p-1 bg-muted rounded-xl">
          <button
            onClick={() => setShowArchived(false)}
            className={cn(
              "flex-1 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2",
              !showArchived 
                ? "bg-card shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn(
              "w-2 h-2 rounded-full",
              !showArchived ? "bg-primary" : "bg-muted-foreground/50"
            )} />
            Active
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-xs",
              !showArchived ? "bg-primary/10 text-primary" : "bg-muted-foreground/20"
            )}>
              {activeProjects.length}
            </span>
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={cn(
              "flex-1 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2",
              showArchived 
                ? "bg-card shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Archive size={14} />
            Archived
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-xs",
              showArchived ? "bg-primary/10 text-primary" : "bg-muted-foreground/20"
            )}>
              {archivedProjects.length}
            </span>
          </button>
        </div>
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
          <div className="space-y-3">
            <AnimatePresence>
              {displayedProjects.map((project) => {
                const spent = getProjectSpending(project.id);
                const income = getProjectIncome(project.id);
                const net = income - spent;
                const remaining = project.budgetLimit - spent;
                const healthStatus: HealthStatus = net >= 0 ? 'healthy' : net >= -(project.budgetLimit * 0.2) ? 'at-risk' : 'critical';
                const budgetPercent = project.budgetLimit > 0 ? Math.min((spent / project.budgetLimit) * 100, 100) : 0;
                const transactionCount = getProjectTransactions(project.id).length;
                const isOverBudget = spent > project.budgetLimit && project.budgetLimit > 0;

                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "bg-card rounded-2xl border border-border overflow-hidden",
                      project.archived && "opacity-60"
                    )}
                  >
                    {/* Health Indicator Strip */}
                    <div className={cn(
                      "h-1 w-full bg-gradient-to-r",
                      project.archived ? "from-muted to-muted" : getHealthGradient(healthStatus)
                    )} style={{ backgroundColor: project.archived ? undefined : project.color }} />
                    
                    {/* Header with Three-Dot Menu */}
                    <div className="flex items-start justify-between p-3 pb-0">
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="flex items-start gap-2.5 flex-1 min-w-0 text-left"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${project.color}20` }}
                        >
                          <FolderKanban size={16} style={{ color: project.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold truncate leading-tight">{project.name}</p>
                            {!project.archived && (
                              <span className={cn("w-2 h-2 rounded-full shrink-0", getHealthDot(healthStatus))} />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </button>
                      
                      {/* Three-Dot Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors -mt-0.5"
                          >
                            <MoreVertical size={16} className="text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(project);
                            }}
                            className="gap-2"
                          >
                            <Copy size={14} />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setArchiveProject(project);
                            }}
                            className="gap-2"
                          >
                            {project.archived ? (
                              <>
                                <ArchiveRestore size={14} />
                                Restore
                              </>
                            ) : (
                              <>
                                <Archive size={14} />
                                Archive
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteProjectState(project);
                            }}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 size={14} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Card Content */}
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="w-full px-3 pb-3 pt-3 text-left hover:bg-accent/30 transition-colors"
                    >

                      {/* Budget Progress */}
                      {project.budgetLimit > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round(budgetPercent)}% used
                            </span>
                            <span className={cn(
                              "text-[10px] font-medium",
                              isOverBudget ? "text-red-500" : "text-muted-foreground"
                            )}>
                              {isOverBudget ? 'Over budget!' : `₹${remaining.toLocaleString()} left`}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${budgetPercent}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: isOverBudget ? '#EF4444' : project.color,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-green-500/10 rounded-lg p-2">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Income</p>
                          <p className="text-xs font-semibold mt-0.5 text-green-600">₹{income.toLocaleString()}</p>
                        </div>
                        <div className="bg-red-500/10 rounded-lg p-2">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Expenses</p>
                          <p className="text-xs font-semibold mt-0.5 text-red-600">₹{spent.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Budget</p>
                          <p className="text-xs font-semibold mt-0.5">₹{project.budgetLimit.toLocaleString()}</p>
                        </div>
                        <div className={cn(
                          "rounded-lg p-2",
                          net >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                        )}>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Net</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {net >= 0 ? (
                              <TrendingUp size={10} className="text-green-600" />
                            ) : (
                              <TrendingDown size={10} className="text-red-600" />
                            )}
                            <p className={cn(
                              "text-xs font-semibold",
                              net >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {net >= 0 ? '+' : ''}₹{net.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
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
        income={selectedProject ? getProjectIncome(selectedProject.id) : 0}
        transactions={selectedProject ? getProjectTransactions(selectedProject.id) : []}
        vendorBreakdown={selectedProject ? getVendorBreakdown(selectedProject.id) : []}
        userId={userId}
        onEditSheetChange={onEditSheetChange}
      />

      {/* Archive Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!archiveProject}
        onClose={() => setArchiveProject(null)}
        onConfirm={handleArchiveConfirm}
        title={archiveProject?.archived ? "Restore Project" : "Archive Project"}
        description={
          archiveProject?.archived 
            ? `Are you sure you want to restore "${archiveProject?.name}"? It will appear in your active projects.`
            : `Are you sure you want to archive "${archiveProject?.name}"? You can restore it anytime from the Archived tab.`
        }
        variant={archiveProject?.archived ? 'restore' : 'archive'}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteProjectState}
        onClose={() => setDeleteProjectState(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteProjectState?.name}"? This action cannot be undone.`}
        variant="delete"
      />
    </div>
  );
};

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, TrendingUp, TrendingDown, Archive, ArchiveRestore, PiggyBank, Receipt, Search, MoreVertical, Copy, Trash2, Plus, X, Check, Tag, ArrowDown, Pencil, Users } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Project } from "@/lib/types";
import { ProjectDetailSheet } from "./ProjectDetailSheet";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { cn } from "@/lib/utils";
import { formatCompactCurrency } from "@/lib/constants";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
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
  const { projects, getProjectSpending, getProjectIncome, transactions, updateProject, deleteProject, addProject, projectLabels, addProjectLabel } = useFinanceStore();
  const { isOwner, isAdmin } = useUserRole();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveProject, setArchiveProject] = useState<Project | null>(null);
  const [deleteProjectState, setDeleteProjectState] = useState<Project | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', internalCost: 0, clientCost: 0, expectedMargin: 0, color: '#10B981', labelIds: [] as string[], assignedEmployeeIds: [] as string[] });
  const [newLabelName, setNewLabelName] = useState('');
  const [employees, setEmployees] = useState<{ user_id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data: members } = await supabase
        .from('org_members')
        .select('user_id, role')
        .eq('role', 'employee')
        .eq('status', 'active');
      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);
        setEmployees((profiles || []).map(p => ({ user_id: p.user_id, name: p.name || 'Unknown' })));
      }
    };
    fetchEmployees();
  }, []);

  const startEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setShowAddForm(false);
    setFormData({
      name: project.name,
      description: project.description || '',
      internalCost: project.internalCost,
      clientCost: project.clientCost || 0,
      expectedMargin: project.expectedMargin || 0,
      color: project.color,
      labelIds: project.labelIds || [],
      assignedEmployeeIds: project.assignedEmployeeIds || [],
    });
    setNewLabelName('');
  };

  const handleUpdateProject = (id: string) => {
    if (!formData.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    updateProject(id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      internalCost: formData.internalCost,
      clientCost: formData.clientCost,
      expectedMargin: formData.expectedMargin,
      color: formData.color,
      labelIds: formData.labelIds,
      assignedEmployeeIds: formData.assignedEmployeeIds,
    }, userId);
    toast.success("Project updated");
    setEditingProjectId(null);
    setNewLabelName('');
  };

  const COLOR_OPTIONS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];
  const computedMargin = formData.clientCost - formData.internalCost;

  const handleAddProject = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    addProject({
      name: formData.name.trim(),
      description: formData.description.trim(),
      internalCost: formData.internalCost,
      clientCost: formData.clientCost,
      expectedMargin: formData.expectedMargin,
      color: formData.color,
      labelIds: formData.labelIds,
      assignedEmployeeIds: formData.assignedEmployeeIds,
    }, userId);
    toast.success("Project added");
    setShowAddForm(false);
    setFormData({ name: '', description: '', internalCost: 0, clientCost: 0, expectedMargin: 0, color: '#10B981', labelIds: [], assignedEmployeeIds: [] });
    setNewLabelName('');
  };

  // Filter projects
  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);
  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  // Calculate totals based on selected tab
  const relevantProjects = showArchived ? archivedProjects : activeProjects;
  const totalInternalCost = relevantProjects.reduce((sum, p) => sum + p.internalCost, 0);
  const totalClientCost = relevantProjects.reduce((sum, p) => sum + (p.clientCost || 0), 0);
  const totalSpent = relevantProjects.reduce((sum, p) => sum + getProjectSpending(p.id), 0);
  const totalIncome = relevantProjects.reduce((sum, p) => sum + getProjectIncome(p.id), 0);
  const totalExpectedMargin = relevantProjects.reduce((sum, p) => sum + (p.expectedMargin || 0), 0);

  // Handle project duplication
  const handleDuplicate = (project: Project) => {
    const { addProject } = useFinanceStore.getState();
    addProject({
      name: `${project.name} (Copy)`,
      description: project.description,
      notes: project.notes,
      internalCost: project.internalCost,
      clientCost: project.clientCost || 0,
      expectedMargin: project.expectedMargin || 0,
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

  // If a project is selected, render the full-page detail view
  if (selectedProject) {
    return (
      <div className="relative min-h-screen">
        <ProjectDetailSheet
          project={selectedProject}
          isOpen={true}
          onClose={() => setSelectedProject(null)}
          spent={getProjectSpending(selectedProject.id)}
          income={getProjectIncome(selectedProject.id)}
          transactions={getProjectTransactions(selectedProject.id)}
          vendorBreakdown={getVendorBreakdown(selectedProject.id)}
          userId={userId}
          onEditSheetChange={onEditSheetChange}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-8 md:px-6 md:max-w-6xl">
      {/* Enhanced Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border safe-top">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <FolderKanban size={20} className="text-accent-foreground" />
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
          <button 
            onClick={() => { setShowAddForm(true); setFormData({ name: '', description: '', internalCost: 0, clientCost: 0, expectedMargin: 0, color: '#10B981', labelIds: [], assignedEmployeeIds: [] }); setNewLabelName(''); }}
            className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            title="Add Project"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Inline Add Project Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="px-4 py-4 space-y-3 bg-card md:max-w-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">New Project</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-muted rounded">
                  <X size={16} />
                </button>
              </div>
              <Input
                placeholder="Project name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
              <Input
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Color</p>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn("w-7 h-7 rounded-full transition-all", formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : '')}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {/* Label Picker */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {projectLabels.map((label) => {
                    const isSelected = formData.labelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            labelIds: isSelected
                              ? formData.labelIds.filter(id => id !== label.id)
                              : [...formData.labelIds, label.id],
                          });
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1",
                          isSelected
                            ? 'text-white'
                            : 'bg-muted text-foreground hover:bg-muted/80'
                        )}
                        style={isSelected ? { backgroundColor: label.color } : undefined}
                      >
                        <Tag size={10} />
                        #{label.name}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="+ New label"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    className="h-8 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLabelName.trim()) {
                        e.preventDefault();
                        if (projectLabels.some(l => l.name.toLowerCase() === newLabelName.trim().toLowerCase())) {
                          toast.error("Label already exists");
                          return;
                        }
                        addProjectLabel({ name: newLabelName.trim(), color: '#8B5CF6' }, userId);
                        setNewLabelName('');
                        toast.success("Label created");
                      }
                    }}
                  />
                  {newLabelName.trim() && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => {
                        if (projectLabels.some(l => l.name.toLowerCase() === newLabelName.trim().toLowerCase())) {
                          toast.error("Label already exists");
                          return;
                        }
                        addProjectLabel({ name: newLabelName.trim(), color: '#8B5CF6' }, userId);
                        setNewLabelName('');
                        toast.success("Label created");
                      }}
                    >
                      Add
                    </Button>
                  )}
                </div>
              </div>
              {/* Assign Employees */}
              {(isOwner || isAdmin) && employees.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Users size={12} /> Assign Employees
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {employees.map((emp) => {
                      const isSelected = formData.assignedEmployeeIds.includes(emp.user_id);
                      return (
                        <button
                          key={emp.user_id}
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            assignedEmployeeIds: isSelected
                              ? formData.assignedEmployeeIds.filter(id => id !== emp.user_id)
                              : [...formData.assignedEmployeeIds, emp.user_id],
                          })}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                          }`}
                        >
                          {emp.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <Button onClick={handleAddProject} className="w-full" size="sm">
                <Check size={14} className="mr-1" /> Add Project
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Summary Section */}
      <div className="px-4 pt-4">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-3 pb-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{showArchived ? 'Archived' : 'Active'} Portfolio</p>
          </div>
          {/* Stats Row - 3-column grid */}
          <div className="grid grid-cols-3 gap-px bg-border mx-3 mb-3 rounded-xl overflow-hidden">
            <div className="bg-card p-2.5 flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowDown size={14} className="text-green-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Income</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">
                <span className="lg:hidden">₹{formatCompactCurrency(totalIncome, false)}</span>
                <span className="hidden lg:inline">₹{totalIncome.toLocaleString()}</span>
              </p>
            </div>
            <div className="bg-card p-2.5 flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Receipt size={14} className="text-destructive" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expenses</p>
              <p className="text-sm font-bold text-destructive">
                <span className="lg:hidden">₹{formatCompactCurrency(totalSpent, false)}</span>
                <span className="hidden lg:inline">₹{totalSpent.toLocaleString()}</span>
              </p>
            </div>
            <div className="bg-card p-2.5 flex flex-col items-center gap-1">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", (totalIncome - totalSpent) >= 0 ? "bg-green-500/10" : "bg-destructive/10")}>
                {(totalIncome - totalSpent) >= 0 ? (
                  <TrendingUp size={14} className="text-green-500" />
                ) : (
                  <TrendingDown size={14} className="text-destructive" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Margin</p>
              <p className={cn("text-sm font-bold", (totalIncome - totalSpent) >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                <span className="lg:hidden">₹{formatCompactCurrency(totalIncome - totalSpent, false)}</span>
                <span className="hidden lg:inline">₹{(totalIncome - totalSpent).toLocaleString()}</span>
              </p>
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
              !showArchived ? "bg-accent text-accent-foreground" : "bg-muted-foreground/20"
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
              showArchived ? "bg-accent text-accent-foreground" : "bg-muted-foreground/20"
            )}>
              {archivedProjects.length}
            </span>
          </button>
        </div>
      </div>

      {/* Project Cards - Two Column Grid */}
      <div className="px-4 pt-4 pb-4">
        {displayedProjects.length === 0 ? (
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-center py-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              {showArchived ? <Archive size={24} className="text-muted-foreground" /> : <FolderKanban size={24} className="text-muted-foreground" />}
            </div>
            <p className="font-medium text-sm">
              {showArchived ? 'No archived projects' : 'No active projects'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {showArchived ? 'Archived projects will appear here' : 'Tap the + button above to add a project'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {displayedProjects.map((project) => {
                const spent = getProjectSpending(project.id);
                const income = getProjectIncome(project.id);
                const net = income - spent;
                const budgetPercent = income > 0 ? Math.min((spent / income) * 100, 100) : 0;
                const healthStatus: HealthStatus = budgetPercent < 80 ? 'healthy' : budgetPercent < 100 ? 'at-risk' : 'critical';
                const transactionCount = getProjectTransactions(project.id).length;
                const isOverBudget = income > 0 && spent > income;

                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}
                    className={cn(
                      "bg-card rounded-2xl border border-border overflow-hidden transition-shadow",
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
                              <motion.span
                                className={cn("w-2 h-2 rounded-full shrink-0", getHealthDot(healthStatus))}
                                animate={healthStatus !== 'healthy' ? { scale: [1, 1.4, 1] } : undefined}
                                transition={healthStatus !== 'healthy' ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : undefined}
                              />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                          </p>
                          {Array.isArray(project.labelIds) && project.labelIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.labelIds.map(lid => {
                                const label = projectLabels.find(l => l.id === lid);
                                if (!label) return null;
                                return (
                                  <span
                                    key={lid}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                                    style={{ backgroundColor: label.color }}
                                  >
                                    #{label.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
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
                              startEdit(project);
                            }}
                            className="gap-2"
                          >
                            <Pencil size={14} />
                            Edit
                          </DropdownMenuItem>
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
                    
                    {/* Edit Form or Card Content */}
                    {editingProjectId === project.id ? (
                      <div className="px-3 pb-3 pt-2 space-y-3">
                        <Input
                          placeholder="Project name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          autoFocus
                        />
                        <Input
                          placeholder="Description (optional)"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Color</p>
                          <div className="flex gap-2">
                            {COLOR_OPTIONS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setFormData({ ...formData, color })}
                                className={cn("w-7 h-7 rounded-full transition-all", formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : '')}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        {/* Label Picker */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Labels</p>
                          <div className="flex flex-wrap gap-1.5">
                            {projectLabels.map((label) => {
                              const isSelected = formData.labelIds.includes(label.id);
                              return (
                                <button
                                  key={label.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      labelIds: isSelected
                                        ? formData.labelIds.filter(id => id !== label.id)
                                        : [...formData.labelIds, label.id],
                                    });
                                  }}
                                  className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1",
                                    isSelected ? 'text-white' : 'bg-muted text-foreground hover:bg-muted/80'
                                  )}
                                  style={isSelected ? { backgroundColor: label.color } : undefined}
                                >
                                  <Tag size={10} />
                                  #{label.name}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              placeholder="+ New label"
                              value={newLabelName}
                              onChange={(e) => setNewLabelName(e.target.value)}
                              className="h-8 text-xs flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newLabelName.trim()) {
                                  e.preventDefault();
                                  if (projectLabels.some(l => l.name.toLowerCase() === newLabelName.trim().toLowerCase())) {
                                    toast.error("Label already exists");
                                    return;
                                  }
                                  addProjectLabel({ name: newLabelName.trim(), color: '#8B5CF6' }, userId);
                                  setNewLabelName('');
                                  toast.success("Label created");
                                }
                              }}
                            />
                            {newLabelName.trim() && (
                              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                                if (projectLabels.some(l => l.name.toLowerCase() === newLabelName.trim().toLowerCase())) {
                                  toast.error("Label already exists");
                                  return;
                                }
                                addProjectLabel({ name: newLabelName.trim(), color: '#8B5CF6' }, userId);
                                setNewLabelName('');
                                toast.success("Label created");
                              }}>
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Assign Employees */}
                        {(isOwner || isAdmin) && employees.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Users size={12} /> Assign Employees
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {employees.map((emp) => {
                                const isSelected = formData.assignedEmployeeIds.includes(emp.user_id);
                                return (
                                  <button
                                    key={emp.user_id}
                                    type="button"
                                    onClick={() => setFormData({
                                      ...formData,
                                      assignedEmployeeIds: isSelected
                                        ? formData.assignedEmployeeIds.filter(id => id !== emp.user_id)
                                        : [...formData.assignedEmployeeIds, emp.user_id],
                                    })}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                                    }`}
                                  >
                                    {emp.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setEditingProjectId(null)} className="flex-1" size="sm">
                            Cancel
                          </Button>
                          <Button onClick={() => handleUpdateProject(project.id)} className="flex-1" size="sm">
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="w-full px-3 pb-2.5 pt-2 text-left hover:bg-accent/30 transition-colors"
                      >
                        {/* Budget Progress with inline stats */}
                        {income > 0 && (
                          <div className="mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] text-muted-foreground">
                                ₹{formatCompactCurrency(spent, false)} / ₹{formatCompactCurrency(income, false)}
                              </span>
                              <span className={cn(
                                "text-[10px] font-medium",
                                budgetPercent >= 80 ? "text-destructive" : budgetPercent >= 60 ? "text-amber-500" : "text-muted-foreground"
                              )}>
                                {isOverBudget ? 'Over income!' : `${Math.round(budgetPercent)}%`}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${budgetPercent}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor: budgetPercent >= 80 ? 'hsl(var(--destructive))' : budgetPercent >= 60 ? 'hsl(38, 92%, 50%)' : project.color,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Compact Stats Row - 3-column grid */}
                        <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden mt-1">
                          <div className="bg-card p-2 flex flex-col items-center gap-0.5">
                            <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center">
                              <ArrowDown size={12} className="text-green-500" />
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Income</p>
                            <p className="text-xs font-bold text-green-600 dark:text-green-400">₹{formatCompactCurrency(income, false)}</p>
                          </div>
                          <div className="bg-card p-2 flex flex-col items-center gap-0.5">
                            <div className="w-6 h-6 rounded-lg bg-destructive/10 flex items-center justify-center">
                              <Receipt size={12} className="text-destructive" />
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expenses</p>
                            <p className="text-xs font-bold text-destructive">₹{formatCompactCurrency(spent, false)}</p>
                          </div>
                          <div className="bg-card p-2 flex flex-col items-center gap-0.5">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: (income - spent) >= 0 ? 'hsl(142 71% 45% / 0.1)' : 'hsl(var(--destructive) / 0.1)' }}>
                              {(income - spent) >= 0 ? (
                                <TrendingUp size={12} className="text-green-500" />
                              ) : (
                                <TrendingDown size={12} className="text-destructive" />
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Margin</p>
                            <p className={cn("text-xs font-bold", (income - spent) >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                              ₹{formatCompactCurrency(income - spent, false)}
                            </p>
                          </div>
                        </div>
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>


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

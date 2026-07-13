import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, Archive, ArchiveRestore, MoreVertical, Copy, Trash2, Plus, X, Check, Tag, Pencil, Users, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { useSuccessAnimationStore } from "@/lib/successAnimationStore";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CashFlowChart } from "./CashFlowChart";
import { SummaryCard } from "./SummaryCard";
import { TimeFrameDropdown, computeDateRange } from "./TimeFrameSelector";
import { ProjectFilterSheet, ProjectFilters, emptyProjectFilters, countActiveProjectFilters } from "./ProjectFilterSheet";
interface ProjectOverviewPageProps {
  userId?: string;
  isEmployee?: boolean;
  onEditSheetChange?: (isOpen: boolean) => void;
}

type HealthStatus = 'healthy' | 'at-risk' | 'critical';

const getHealthStatus = (actualMargin: number, expectedMargin: number): HealthStatus => {
  if (expectedMargin <= 0) return 'healthy';
  const healthPercent = (actualMargin / expectedMargin) * 100;
  if (healthPercent >= 100) return 'healthy';
  if (healthPercent >= 50) return 'at-risk';
  return 'critical';
};

const getHealthDot = (status: HealthStatus): string => {
  switch (status) {
    case 'healthy': return 'bg-green-500';
    case 'at-risk': return 'bg-yellow-500';
    case 'critical': return 'bg-red-500';
  }
};

export const ProjectOverviewPage = ({ userId, isEmployee = false, onEditSheetChange }: ProjectOverviewPageProps) => {
  const {
    projects, getProjectSpending, getProjectIncome, transactions, updateProject, deleteProject, addProject, projectLabels, addProjectLabel,
    activeTimeFilter, activeCustomStartDate, activeCustomEndDate, setActiveTimeFilter, setActiveCustomDateRange,
  } = useFinanceStore();
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
  const [projectFilters, setProjectFilters] = useState<ProjectFilters>(emptyProjectFilters);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [projectSortBy, setProjectSortBy] = useState<string>('name-asc');
  const activeProjectFilterCount = countActiveProjectFilters(projectFilters);

  const timeFilter = activeTimeFilter;
  const customStartDate = useMemo(
    () => (activeCustomStartDate ? new Date(activeCustomStartDate) : undefined),
    [activeCustomStartDate]
  );
  const customEndDate = useMemo(
    () => (activeCustomEndDate ? new Date(activeCustomEndDate) : undefined),
    [activeCustomEndDate]
  );
  const setCustomStartDate = (date: Date | undefined) => setActiveCustomDateRange(date ? date.toISOString() : null, activeCustomEndDate);
  const setCustomEndDate = (date: Date | undefined) => setActiveCustomDateRange(activeCustomStartDate, date ? date.toISOString() : null);
  const dateRange = useMemo(
    () => computeDateRange(timeFilter, customStartDate, customEndDate),
    [timeFilter, customStartDate, customEndDate]
  );

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
    useSuccessAnimationStore.getState().show("Project Updated");
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
    useSuccessAnimationStore.getState().show("Project Added");
    setShowAddForm(false);
    setFormData({ name: '', description: '', internalCost: 0, clientCost: 0, expectedMargin: 0, color: '#10B981', labelIds: [], assignedEmployeeIds: [] });
    setNewLabelName('');
  };

  // Filter projects - employees only see assigned projects; apply label/employee filters
  const matchesProjectFilters = (p: Project) => {
    if (projectFilters.labelIds.length > 0 && !(p.labelIds || []).some(lid => projectFilters.labelIds.includes(lid))) return false;
    if (projectFilters.employeeIds.length > 0 && !(p.assignedEmployeeIds || []).some(eid => projectFilters.employeeIds.includes(eid))) return false;
    return true;
  };
  const activeProjects = projects.filter(p => !p.archived).filter(p => !isEmployee || (p.assignedEmployeeIds || []).includes(userId || '')).filter(matchesProjectFilters);
  const archivedProjects = projects.filter(p => p.archived).filter(p => !isEmployee || (p.assignedEmployeeIds || []).includes(userId || '')).filter(matchesProjectFilters);

  // Calculate totals based on selected tab
  const relevantProjects = showArchived ? archivedProjects : activeProjects;
  const relevantProjectIds = new Set(relevantProjects.map(p => p.id));

  // Transactions for the currently displayed projects, scoped to the selected time frame
  const scopedProjectTransactions = useMemo(
    () => transactions.filter(t => t.projectId && relevantProjectIds.has(t.projectId) && t.date >= dateRange.start && t.date <= dateRange.end),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- relevantProjectIds is derived fresh each render from relevantProjects/showArchived/projectFilters, which are already covered by their own inputs
    [transactions, showArchived, projectFilters, projects, dateRange]
  );

  const getProjectSpendingInRange = (projectId: string) =>
    scopedProjectTransactions.filter(t => t.projectId === projectId && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const getProjectIncomeInRange = (projectId: string) =>
    scopedProjectTransactions.filter(t => t.projectId === projectId && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  const totalInternalCost = relevantProjects.reduce((sum, p) => sum + p.internalCost, 0);
  const totalClientCost = relevantProjects.reduce((sum, p) => sum + (p.clientCost || 0), 0);
  const totalSpent = scopedProjectTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = scopedProjectTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpectedMargin = relevantProjects.reduce((sum, p) => sum + (p.expectedMargin || 0), 0);

  // Sort the displayed projects
  const displayedProjects = useMemo(() => {
    const list = [...relevantProjects];
    switch (projectSortBy) {
      case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'income-desc': list.sort((a, b) => getProjectIncomeInRange(b.id) - getProjectIncomeInRange(a.id)); break;
      case 'expense-desc': list.sort((a, b) => getProjectSpendingInRange(b.id) - getProjectSpendingInRange(a.id)); break;
      case 'margin-desc': list.sort((a, b) => (getProjectIncomeInRange(b.id) - getProjectSpendingInRange(b.id)) - (getProjectIncomeInRange(a.id) - getProjectSpendingInRange(a.id))); break;
      case 'margin-asc': list.sort((a, b) => (getProjectIncomeInRange(a.id) - getProjectSpendingInRange(a.id)) - (getProjectIncomeInRange(b.id) - getProjectSpendingInRange(b.id))); break;
      case 'recent': list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')); break;
      case 'event-date-desc':
        list.sort((a, b) => {
          if (!a.eventDate && !b.eventDate) return 0;
          if (!a.eventDate) return 1;
          if (!b.eventDate) return -1;
          return b.eventDate.localeCompare(a.eventDate);
        });
        break;
      case 'event-date-asc':
        list.sort((a, b) => {
          if (!a.eventDate && !b.eventDate) return 0;
          if (!a.eventDate) return 1;
          if (!b.eventDate) return -1;
          return a.eventDate.localeCompare(b.eventDate);
        });
        break;
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getProjectIncomeInRange/getProjectSpendingInRange are derived from scopedProjectTransactions, already a dependency
  }, [relevantProjects, projectSortBy, scopedProjectTransactions]);

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
    useSuccessAnimationStore.getState().show("Project Duplicated");
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
      useSuccessAnimationStore.getState().show(archiveProject.archived ? 'Project Restored' : 'Project Archived');
      setArchiveProject(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteProjectState) {
      deleteProject(deleteProjectState.id, userId);
      useSuccessAnimationStore.getState().show("Project Deleted");
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
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 safe-top">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Projects</h1>
          <div className="flex items-center gap-2">
            <TimeFrameDropdown
              timeFilter={timeFilter}
              onTimeFilterChange={setActiveTimeFilter}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartDateChange={setCustomStartDate}
              onCustomEndDateChange={setCustomEndDate}
            />
            <button
              onClick={() => { setShowAddForm(true); setFormData({ name: '', description: '', internalCost: 0, clientCost: 0, expectedMargin: 0, color: '#10B981', labelIds: [], assignedEmployeeIds: [] }); setNewLabelName(''); }}
              className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="Add Project"
            >
              <Plus size={18} />
            </button>
          </div>
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
              {(isOwner || isAdmin) && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Users size={12} /> Assign Employees
                  </p>
                  {employees.length > 0 ? (
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
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No employees added yet. Add employees via Settings → Team.</p>
                  )}
                </div>
              )}
              <Button onClick={handleAddProject} className="w-full" size="sm">
                <Check size={14} className="mr-1" /> Add Project
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio Summary + Cash Flow - same components as the Home page */}
      <div className="px-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <SummaryCard title="Income" amount={totalIncome} type="income" />
          <SummaryCard title="Expenses" amount={totalSpent} type="expense" />
          <SummaryCard title="Net Margin" amount={totalIncome - totalSpent} type="balance" />
        </div>

        <CashFlowChart
          transactions={scopedProjectTransactions}
          timeFilter={timeFilter}
          dateRange={dateRange}
          topRightExtra={
            <Select value={showArchived ? 'archived' : 'active'} onValueChange={(v) => setShowArchived(v === 'archived')}>
              <SelectTrigger className="w-auto h-6 gap-1 px-2 py-0.5 rounded-full border-none bg-muted text-[11px] font-medium text-foreground hover:bg-muted/80 transition-colors focus:ring-0 focus:ring-offset-0 [&>svg:last-child]:opacity-100 [&>svg:last-child]:h-3 [&>svg:last-child]:w-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="active">Active ({activeProjects.length})</SelectItem>
                <SelectItem value="archived">Archived ({archivedProjects.length})</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </div>

      {/* Filters & Sort */}
      <div className="px-4 pt-3 flex items-center justify-between gap-2">
        <button
          onClick={() => setIsFilterSheetOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            activeProjectFilterCount > 0 ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeProjectFilterCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeProjectFilterCount}
            </span>
          )}
        </button>

        <Select value={projectSortBy} onValueChange={setProjectSortBy}>
          <SelectTrigger className="w-auto h-auto gap-1.5 px-3 py-1.5 rounded-full border-none bg-muted text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors focus:ring-0 focus:ring-offset-0 [&>svg:last-child]:opacity-100 [&>svg:last-child]:h-3.5 [&>svg:last-child]:w-3.5">
            <ArrowUpDown size={14} className="text-muted-foreground shrink-0" />
            Sort
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="income-desc">Income (High)</SelectItem>
            <SelectItem value="expense-desc">Expenses (High)</SelectItem>
            <SelectItem value="margin-desc">Margin (High)</SelectItem>
            <SelectItem value="margin-asc">Margin (Low)</SelectItem>
            <SelectItem value="recent">Created (Newest)</SelectItem>
            <SelectItem value="event-date-desc">Event Date (Newest)</SelectItem>
            <SelectItem value="event-date-asc">Event Date (Oldest)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ProjectFilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        filters={projectFilters}
        onFiltersChange={setProjectFilters}
        resultCount={displayedProjects.length}
        projectLabels={projectLabels}
        employees={employees}
      />

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
                const spent = getProjectSpendingInRange(project.id);
                const income = getProjectIncomeInRange(project.id);
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
                    whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
                    className={cn(
                      "bg-card rounded-2xl border border-border border-l-4 overflow-hidden transition-shadow",
                      project.archived && "opacity-60"
                    )}
                    style={{ borderLeftColor: project.archived ? 'hsl(var(--border))' : project.color }}
                  >
                    {/* Header with Three-Dot Menu */}
                    <div className="flex items-center justify-between gap-2 p-3.5 pb-2.5">
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold truncate leading-tight">{project.name}</p>
                            {!project.archived && healthStatus !== 'healthy' && (
                              <motion.span
                                className={cn("w-1.5 h-1.5 rounded-full shrink-0", getHealthDot(healthStatus))}
                                animate={{ scale: [1, 1.4, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </button>

                      {/* Three-Dot Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
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
                        {(isOwner || isAdmin) && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Users size={12} /> Assign Employees
                            </p>
                            {employees.length > 0 ? (
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
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No employees added yet. Add employees via Settings → Team.</p>
                            )}
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
                        className="w-full px-3.5 pb-3.5 text-left hover:bg-accent/30 transition-colors"
                      >
                        {/* Labels */}
                        {Array.isArray(project.labelIds) && project.labelIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
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

                        {/* Financial Numbers - clean, no boxes */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Income</p>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400 truncate">₹{formatCompactCurrency(income, false)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expenses</p>
                            <p className="text-sm font-bold text-destructive truncate">₹{formatCompactCurrency(spent, false)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Margin</p>
                            <p className={cn("text-sm font-bold truncate", net >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                              ₹{formatCompactCurrency(net, false)}
                            </p>
                          </div>
                        </div>

                        {/* Budget Progress */}
                        {income > 0 && (
                          <div className="mt-3">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] text-muted-foreground">
                                ₹{formatCompactCurrency(spent, false)} of ₹{formatCompactCurrency(income, false)} spent
                              </span>
                              <span className={cn(
                                "text-[10px] font-medium",
                                budgetPercent >= 80 ? "text-destructive" : budgetPercent >= 60 ? "text-amber-500" : "text-muted-foreground"
                              )}>
                                {isOverBudget ? 'Over income!' : `${Math.round(budgetPercent)}%`}
                              </span>
                            </div>
                          </div>
                        )}
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

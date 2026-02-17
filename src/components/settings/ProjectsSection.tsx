import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, FolderKanban, Archive, ArchiveRestore, Tag, MoreVertical, Wallet, TrendingDown, TrendingUp } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ProjectsSectionProps {
  onBack: () => void;
  userId?: string;
}

const COLOR_OPTIONS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export const ProjectsSection = ({ onBack, userId }: ProjectsSectionProps) => {
  const { projects, addProject, updateProject, deleteProject, getProjectSpending, getProjectIncome, projectLabels, addProjectLabel } = useFinanceStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveProject, setArchiveProject] = useState<typeof projects[0] | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', notes: '', internalCost: 0, clientCost: 0, expectedMargin: 0, color: '#10B981', labelIds: [] as string[] });
  const [newLabelName, setNewLabelName] = useState('');

  // Filter projects
  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);
  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  const computedMargin = formData.clientCost - formData.internalCost;

  const handleAdd = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    addProject({
      name: formData.name.trim(),
      description: formData.description.trim(),
      notes: formData.notes.trim() || undefined,
      internalCost: formData.internalCost,
      clientCost: formData.clientCost,
      expectedMargin: formData.expectedMargin,
      color: formData.color,
      labelIds: formData.labelIds,
    }, userId);
    toast.success("Project added");
    setShowAddForm(false);
    setFormData({ name: '', description: '', notes: '', internalCost: 0, clientCost: 0, expectedMargin: 0, color: '#10B981', labelIds: [] });
    setNewLabelName('');
  };

  const handleUpdate = (id: string) => {
    if (!formData.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    updateProject(id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      notes: formData.notes.trim() || undefined,
      internalCost: formData.internalCost,
      clientCost: formData.clientCost,
      expectedMargin: formData.expectedMargin,
      color: formData.color,
      labelIds: formData.labelIds,
    }, userId);
    toast.success("Project updated");
    setEditingId(null);
    setNewLabelName('');
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteProject(deleteId, userId);
      toast.success("Project deleted");
      setDeleteId(null);
    }
  };

  const handleArchiveConfirm = () => {
    if (archiveProject) {
      updateProject(archiveProject.id, { archived: !archiveProject.archived }, userId);
      toast.success(archiveProject.archived ? 'Project restored' : 'Project archived');
      setArchiveProject(null);
    }
  };

  const startEdit = (project: typeof projects[0]) => {
    setEditingId(project.id);
    setFormData({
      name: project.name,
      description: project.description || '',
      notes: project.notes || '',
      internalCost: project.internalCost,
      clientCost: project.clientCost || 0,
      expectedMargin: project.expectedMargin || 0,
      color: project.color,
      labelIds: project.labelIds || [],
    });
    setNewLabelName('');
  };

  const renderFormFields = (isEdit: boolean, projectId?: string) => (
    <div className="space-y-4">
      {!isEdit && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">New Project</h3>
          <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-muted rounded">
            <X size={18} />
          </button>
        </div>
      )}
      <Input
        placeholder="Project name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Input
        placeholder="Description (optional)"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <Input
        type="number"
        placeholder="Cost Given to Client (₹)"
        value={formData.clientCost || ''}
        onChange={(e) => setFormData({ ...formData, clientCost: Number(e.target.value) || 0 })}
      />
      <div>
        <p className="text-xs text-muted-foreground mb-2">Color</p>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              onClick={() => setFormData({ ...formData, color })}
              className={`w-8 h-8 rounded-full ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
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
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
                style={isSelected ? { backgroundColor: label.color } : undefined}
              >
                <Tag size={10} />
                #{label.name}
              </button>
            );
          })}
        </div>
        {/* Inline new label */}
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
      {isEdit ? (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={() => handleUpdate(projectId!)} className="flex-1">
            Save
          </Button>
        </div>
      ) : (
        <Button onClick={handleAdd} className="w-full">
          <Check size={16} className="mr-1" /> Add Project
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 safe-top border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Projects</h1>
        </div>
        {!showArchived && (
          <Button size="sm" onClick={() => { setShowAddForm(true); setFormData({ name: '', description: '', notes: '', internalCost: 0, clientCost: 0, expectedMargin: 0, color: '#10B981', labelIds: [] }); setNewLabelName(''); }}>
            <Plus size={16} className="mr-1" /> Add
          </Button>
        )}
      </div>

      {/* Toggle Tabs */}
      <div className="p-4 flex gap-2">
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

      <div className="px-4 pb-4 space-y-3">
        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && !showArchived && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              {renderFormFields(false)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects List */}
        {displayedProjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {showArchived ? 'No archived projects' : 'No projects yet. Add your first project!'}
          </div>
        ) : (
          displayedProjects.map((project) => {
            const spent = getProjectSpending(project.id);
            const percentage = project.internalCost > 0 ? (spent / project.internalCost) * 100 : 0;
            
            return (
              <motion.div
                key={project.id}
                layout
                className={`bg-card rounded-xl border border-border p-4 ${project.archived ? 'opacity-70' : ''}`}
              >
                {editingId === project.id ? (
                  renderFormFields(true, project.id)
                ) : (
                  <div className="space-y-3">
                    {/* Header: Icon + Name + Overflow Menu */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${project.color}20` }}
                      >
                        <FolderKanban size={18} style={{ color: project.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[15px] truncate">{project.name}</p>
                          {project.archived && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground shrink-0">Archived</span>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                        )}
                        {Array.isArray(project.labelIds) && project.labelIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 hover:bg-muted rounded-lg shrink-0 -mr-1">
                            <MoreVertical size={16} className="text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => startEdit(project)}>
                            <Pencil size={14} className="mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setArchiveProject(project)}>
                            {project.archived ? (
                              <><ArchiveRestore size={14} className="mr-2" /> Restore</>
                            ) : (
                              <><Archive size={14} className="mr-2" /> Archive</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(project.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Financial Summary */}
                    {((project.clientCost || 0) > 0 || spent > 0) && (() => {
                      const projectIncome = getProjectIncome(project.id);
                      const netMargin = (project.clientCost || 0) - spent;
                      return (
                        <div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden mt-2">
                          <div className="bg-card p-2 flex flex-col items-center gap-0.5">
                            <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center">
                              <Wallet size={12} className="text-accent-foreground" />
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cost to Client</p>
                            <p className="text-xs font-bold text-foreground">₹{(project.clientCost || 0).toLocaleString()}</p>
                          </div>
                          <div className="bg-card p-2 flex flex-col items-center gap-0.5">
                            <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center">
                              <TrendingUp size={12} className="text-green-500" />
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Income</p>
                            <p className="text-xs font-bold text-green-600 dark:text-green-400">₹{projectIncome.toLocaleString()}</p>
                          </div>
                          <div className="bg-card p-2 flex flex-col items-center gap-0.5">
                            <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
                              <TrendingDown size={12} className="text-red-500" />
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expenses</p>
                            <p className="text-xs font-bold text-destructive">₹{spent.toLocaleString()}</p>
                          </div>
                          <div className="bg-card p-2 flex flex-col items-center gap-0.5">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${netMargin >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                              {netMargin >= 0 ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Margin</p>
                            <p className={`text-xs font-bold ${netMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                              ₹{netMargin.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        description="This will remove the project. Transactions linked to this project won't be deleted."
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
    </div>
  );
};
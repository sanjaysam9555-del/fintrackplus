import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, FolderKanban } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";

interface ProjectsSectionProps {
  onBack: () => void;
  userId?: string;
}

const COLOR_OPTIONS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export const ProjectsSection = ({ onBack, userId }: ProjectsSectionProps) => {
  const { projects, addProject, updateProject, deleteProject, getProjectSpending } = useFinanceStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', budgetLimit: 0, color: '#10B981' });

  const handleAdd = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    addProject({
      name: formData.name.trim(),
      description: formData.description.trim(),
      budgetLimit: formData.budgetLimit,
      color: formData.color,
    }, userId);
    toast.success("Project added");
    setShowAddForm(false);
    setFormData({ name: '', description: '', budgetLimit: 0, color: '#10B981' });
  };

  const handleUpdate = (id: string) => {
    if (!formData.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    updateProject(id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      budgetLimit: formData.budgetLimit,
      color: formData.color,
    }, userId);
    toast.success("Project updated");
    setEditingId(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteProject(deleteId, userId);
      toast.success("Project deleted");
      setDeleteId(null);
    }
  };

  const startEdit = (project: typeof projects[0]) => {
    setEditingId(project.id);
    setFormData({
      name: project.name,
      description: project.description || '',
      budgetLimit: project.budgetLimit,
      color: project.color,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Project Labels</h1>
        </div>
        <Button size="sm" onClick={() => { setShowAddForm(true); setFormData({ name: '', description: '', budgetLimit: 0, color: '#10B981' }); }}>
          <Plus size={16} className="mr-1" /> Add
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-xl border border-border p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">New Project</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-muted rounded">
                  <X size={18} />
                </button>
              </div>
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
                placeholder="Budget limit (₹)"
                value={formData.budgetLimit || ''}
                onChange={(e) => setFormData({ ...formData, budgetLimit: Number(e.target.value) || 0 })}
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
              <Button onClick={handleAdd} className="w-full">
                <Check size={16} className="mr-1" /> Add Project
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No projects yet. Add your first project!
          </div>
        ) : (
          projects.map((project) => {
            const spent = getProjectSpending(project.id);
            const percentage = project.budgetLimit > 0 ? (spent / project.budgetLimit) * 100 : 0;
            
            return (
              <motion.div
                key={project.id}
                layout
                className="bg-card rounded-xl border border-border p-4"
              >
                {editingId === project.id ? (
                  <div className="space-y-4">
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Project name"
                    />
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description"
                    />
                    <Input
                      type="number"
                      value={formData.budgetLimit || ''}
                      onChange={(e) => setFormData({ ...formData, budgetLimit: Number(e.target.value) || 0 })}
                      placeholder="Budget limit (₹)"
                    />
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
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={() => handleUpdate(project.id)} className="flex-1">
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${project.color}20` }}
                      >
                        <FolderKanban size={18} style={{ color: project.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{project.name}</p>
                        {project.description && (
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                        )}
                      </div>
                      <button onClick={() => startEdit(project)} className="p-2 hover:bg-muted rounded-lg">
                        <Pencil size={16} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => setDeleteId(project.id)} className="p-2 hover:bg-destructive/10 rounded-lg">
                        <Trash2 size={16} className="text-destructive" />
                      </button>
                    </div>
                    {project.budgetLimit > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Spent: ₹{spent.toLocaleString()}</span>
                          <span className="text-muted-foreground">Budget: ₹{project.budgetLimit.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                              backgroundColor: percentage > 100 ? '#EF4444' : project.color,
                            }}
                          />
                        </div>
                      </div>
                    )}
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
    </div>
  );
};

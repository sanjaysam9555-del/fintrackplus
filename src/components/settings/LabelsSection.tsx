import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Tag, ChevronDown, ChevronUp, FolderKanban, Search } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface LabelsSectionProps {
  onBack: () => void;
  userId?: string;
}

const LABEL_COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#6366F1',
];

export const LabelsSection = ({ onBack, userId }: LabelsSectionProps) => {
  const { projectLabels, projects, addProjectLabel, updateProjectLabel, deleteProjectLabel, getProjectSpending } = useFinanceStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Projects grouped by label
  const projectsByLabel = useMemo(() => {
    const map: Record<string, typeof projects> = {};
    projectLabels.forEach(label => {
      map[label.id] = projects.filter(p => p.labelIds?.includes(label.id));
    });
    return map;
  }, [projectLabels, projects]);

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Please enter a label name");
      return;
    }
    if (projectLabels.some(l => l.name.toLowerCase() === name.trim().toLowerCase())) {
      toast.error("Label already exists");
      return;
    }
    addProjectLabel({ name: name.trim(), color: selectedColor }, userId);
    toast.success("Label added");
    setShowAddForm(false);
    setName('');
    setSelectedColor(LABEL_COLORS[0]);
  };

  const handleUpdate = (id: string) => {
    if (!name.trim()) {
      toast.error("Please enter a label name");
      return;
    }
    updateProjectLabel(id, { name: name.trim(), color: selectedColor }, userId);
    toast.success("Label updated");
    setEditingId(null);
    setName('');
    setSelectedColor(LABEL_COLORS[0]);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteProjectLabel(deleteId, userId);
      toast.success("Label deleted");
      setDeleteId(null);
    }
  };

  const startEdit = (label: typeof projectLabels[0]) => {
    setEditingId(label.id);
    setName(label.name);
    setSelectedColor(label.color);
  };

  const LabelForm = ({ isEdit = false, labelId = '' }: { isEdit?: boolean; labelId?: string }) => (
    <div className="space-y-4">
      <Input
        placeholder="Label name (e.g. Birthday, Wedding)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div>
        <p className="text-xs text-muted-foreground mb-2">Color</p>
        <div className="flex gap-2">
          {LABEL_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full transition-all ${
                selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) setEditingId(null);
            else setShowAddForm(false);
            setName('');
            setSelectedColor(LABEL_COLORS[0]);
          }}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button onClick={() => isEdit ? handleUpdate(labelId) : handleAdd()} className="flex-1">
          <Check size={16} className="mr-1" /> {isEdit ? 'Save' : 'Add'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 safe-top border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Labels</h1>
        </div>
        <Button size="sm" onClick={() => { setShowAddForm(true); setName(''); setSelectedColor(LABEL_COLORS[0]); }}>
          <Plus size={16} className="mr-1" /> Add
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {/* Search */}
        {projectLabels.length > 5 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search labels..."
              className="pl-9 h-9 text-sm"
            />
          </div>
        )}

        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">New Label</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-muted rounded">
                  <X size={18} />
                </button>
              </div>
              <LabelForm />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Labels List */}
        {projectLabels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Tag size={24} className="text-muted-foreground" />
            </div>
            <p>No labels yet</p>
            <p className="text-sm mt-1">Create labels like #birthday, #wedding to organize projects</p>
          </div>
        ) : (
          projectLabels
            .filter(l => !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((label) => {
            const labelProjects = projectsByLabel[label.id] || [];
            const isExpanded = expandedId === label.id;

            return (
              <motion.div key={label.id} layout className="bg-card rounded-xl border border-border">
                {editingId === label.id ? (
                  <div className="p-4">
                    <LabelForm isEdit labelId={label.id} />
                  </div>
                ) : (
                  <Collapsible open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : label.id)}>
                    <div className="flex items-center gap-3 p-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${label.color}20` }}
                      >
                        <Tag size={18} style={{ color: label.color }} />
                      </div>
                      <CollapsibleTrigger className="flex-1 text-left min-w-0">
                        <p className="font-medium">#{label.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {labelProjects.length} project{labelProjects.length !== 1 ? 's' : ''}
                        </p>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); startEdit(label); }} className="p-2 hover:bg-muted rounded-lg">
                          <Pencil size={16} className="text-muted-foreground" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(label.id); }} className="p-2 hover:bg-destructive/10 rounded-lg">
                          <Trash2 size={16} className="text-destructive" />
                        </button>
                        <CollapsibleTrigger className="p-2 hover:bg-muted rounded-lg">
                          {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                        </CollapsibleTrigger>
                      </div>
                    </div>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                        {labelProjects.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">No projects with this label</p>
                        ) : (
                          labelProjects.map(project => {
                            const spent = getProjectSpending(project.id);
                            return (
                              <div key={project.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${project.color}20` }}
                                >
                                  <FolderKanban size={14} style={{ color: project.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{project.name}</p>
                                  {project.internalCost > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Spent: {CURRENCY_SYMBOL}{spent.toLocaleString()} / {CURRENCY_SYMBOL}{project.internalCost.toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                {project.archived && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Archived</span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
        title="Delete Label"
        description="This will remove the label from all projects. Projects won't be deleted."
      />
    </div>
  );
};

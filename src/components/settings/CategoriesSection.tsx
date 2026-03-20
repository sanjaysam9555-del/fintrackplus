import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, ShoppingBag, Utensils, Car, Zap, Film, Heart, Plane, Wallet, Briefcase, TrendingUp, Coffee, Home, Gift, GraduationCap, Stethoscope, MoreHorizontal, ChevronRight, Search } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { LucideIcon } from "lucide-react";
import { CategoryDetailView } from "./CategoryDetailView";
import { CURRENCY_SYMBOL } from "@/lib/constants";

interface CategoriesSectionProps {
  onBack: () => void;
  userId?: string;
  isEmployee?: boolean;
}

const ICON_OPTIONS: { id: string; icon: LucideIcon }[] = [
  { id: 'shopping', icon: ShoppingBag },
  { id: 'food', icon: Utensils },
  { id: 'transport', icon: Car },
  { id: 'bills', icon: Zap },
  { id: 'entertainment', icon: Film },
  { id: 'health', icon: Stethoscope },
  { id: 'education', icon: GraduationCap },
  { id: 'travel', icon: Plane },
  { id: 'salary', icon: Wallet },
  { id: 'investment', icon: TrendingUp },
  { id: 'freelance', icon: Briefcase },
  { id: 'gift', icon: Gift },
  { id: 'home', icon: Home },
  { id: 'coffee', icon: Coffee },
  { id: 'other', icon: MoreHorizontal },
];
const COLOR_OPTIONS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

const getIconComponent = (iconId: string): LucideIcon => {
  return ICON_OPTIONS.find(i => i.id === iconId)?.icon || MoreHorizontal;
};

export const CategoriesSection = ({ onBack, userId, isEmployee }: CategoriesSectionProps) => {
  const { categories, addCategory, updateCategory, deleteCategory, transactions } = useFinanceStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [formData, setFormData] = useState({ name: '', icon: 'other', color: '#10B981', type: 'expense' as 'income' | 'expense' });
  const [detailCategoryId, setDetailCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Compute transaction counts per category
  const categoryTransactionCounts = categories.reduce<Record<string, { count: number; total: number }>>((acc, cat) => {
    let catTxns = transactions.filter(t => t.categoryId === cat.id);
    if (isEmployee && userId) catTxns = catTxns.filter(t => t.userId === userId);
    acc[cat.id] = { count: catTxns.length, total: catTxns.reduce((s, t) => s + t.amount, 0) };
    return acc;
  }, {});

  const formatAmount = (amount: number) => `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN')}`;

  // Detail view
  const detailCategory = detailCategoryId ? categories.find(c => c.id === detailCategoryId) : null;
  if (detailCategory) {
    return (
      <CategoryDetailView
        category={detailCategory}
        onBack={() => setDetailCategoryId(null)}
        onEdit={() => { if (!isEmployee) { startEdit(detailCategory); setDetailCategoryId(null); } }}
        onDelete={() => { if (!isEmployee) { setDeleteId(detailCategory.id); setDetailCategoryId(null); } }}
        userId={userId}
        isEmployee={isEmployee}
        currentUserId={userId}
      />
    );
  }

  const filteredCategories = (filterType === 'all' ? categories : categories.filter(c => c.type === filterType))
    .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAdd = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    addCategory({
      name: formData.name.trim(),
      icon: formData.icon,
      color: formData.color,
      type: formData.type,
    }, userId);
    toast.success("Category added");
    setShowAddForm(false);
    setFormData({ name: '', icon: 'other', color: '#10B981', type: 'expense' });
  };

  const handleUpdate = (id: string) => {
    if (!formData.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    updateCategory(id, {
      name: formData.name.trim(),
      icon: formData.icon,
      color: formData.color,
      type: formData.type,
    }, userId);
    toast.success("Category updated");
    setEditingId(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteCategory(deleteId, userId);
      toast.success("Category deleted");
      setDeleteId(null);
    }
  };

  const startEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, icon: cat.icon, color: cat.color, type: cat.type });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 safe-top border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Categories</h1>
        </div>
        {!isEmployee && (
          <Button size="sm" onClick={() => { setShowAddForm(true); setFormData({ name: '', icon: 'other', color: '#10B981', type: filterType === 'all' ? 'expense' : filterType }); }}>
            <Plus size={16} className="mr-1" /> Add
          </Button>
        )}
      </div>

      <div className="sticky top-[57px] bg-background z-10 px-4 pt-3 pb-1">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
          {(['all', 'expense', 'income'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${filterType === type ? 'bg-background text-foreground shadow-sm' : ''}`}
            >
              {type === 'all' ? 'All' : type === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Search */}
        {categories.length > 5 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
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
              className="bg-card rounded-xl border border-border p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">New Category</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-muted rounded">
                  <X size={18} />
                </button>
              </div>
              <Input
                placeholder="Category name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${formData.type === 'expense' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${formData.type === 'income' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}
                >
                  Income
                </button>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Icon</p>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((iconOpt) => {
                    const IconComp = iconOpt.icon;
                    return (
                      <button
                        key={iconOpt.id}
                        onClick={() => setFormData({ ...formData, icon: iconOpt.id })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.icon === iconOpt.id ? 'ring-2 ring-primary bg-primary/10' : 'bg-muted'}`}
                      >
                        <IconComp size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>
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
                <Check size={16} className="mr-1" /> Add Category
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories List */}
        {filteredCategories.map((cat) => (
          <motion.div
            key={cat.id}
            layout
            className="bg-card rounded-xl border border-border p-4"
          >
            {editingId === cat.id ? (
              <div className="space-y-4">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${formData.type === 'expense' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}
                  >
                    Expense
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${formData.type === 'income' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}
                  >
                    Income
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((iconOpt) => {
                    const IconComp = iconOpt.icon;
                    return (
                      <button
                        key={iconOpt.id}
                        onClick={() => setFormData({ ...formData, icon: iconOpt.id })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.icon === iconOpt.id ? 'ring-2 ring-primary bg-primary/10' : 'bg-muted'}`}
                      >
                        <IconComp size={18} />
                      </button>
                    );
                  })}
                </div>
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
                  <Button onClick={() => handleUpdate(cat.id)} className="flex-1">
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-3 flex-1 text-left min-w-0"
                  onClick={() => setDetailCategoryId(cat.id)}
                >
                  {(() => {
                    const IconComp = getIconComponent(cat.icon);
                    return (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <IconComp size={18} style={{ color: cat.color }} />
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium truncate">{cat.name}</p>
                      {cat.name === 'Not Specified' && (
                        <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded shrink-0">Default</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="capitalize">{cat.type}</span>
                      {categoryTransactionCounts[cat.id]?.count > 0 && (
                        <> · {categoryTransactionCounts[cat.id].count} txn{categoryTransactionCounts[cat.id].count !== 1 ? 's' : ''} · {formatAmount(categoryTransactionCounts[cat.id].total)}</>
                      )}
                    </p>
                  </div>
                </button>
                {!isEmployee && (
                  <div className="flex items-center gap-1 shrink-0">
                    {cat.name !== 'Not Specified' && (
                      <button onClick={(e) => { e.stopPropagation(); startEdit(cat); }} className="p-2 hover:bg-muted rounded-lg">
                        <Pencil size={16} className="text-muted-foreground" />
                      </button>
                    )}
                    {cat.name !== 'Not Specified' && (
                      <button onClick={(e) => { e.stopPropagation(); setDeleteId(cat.id); }} className="p-2 hover:bg-destructive/10 rounded-lg">
                        <Trash2 size={16} className="text-destructive" />
                      </button>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                )}
                {isEmployee && (
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <DeleteConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        description="This will remove the category. Transactions using this category won't be deleted."
      />
    </div>
  );
};

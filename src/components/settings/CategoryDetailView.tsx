import { useState, useMemo } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import type { Transaction, Category } from "@/lib/types";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TransactionItem } from "@/components/TransactionItem";
import { LucideIcon } from "lucide-react";
import { ShoppingBag, Utensils, Car, Zap, Film, Heart, Plane, Wallet, Briefcase, TrendingUp, Coffee, Home, Gift, GraduationCap, Stethoscope, MoreHorizontal } from "lucide-react";

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

const getIconComponent = (iconId: string): LucideIcon => {
  return ICON_OPTIONS.find(i => i.id === iconId)?.icon || MoreHorizontal;
};

interface CategoryDetailViewProps {
  category: Category;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  userId?: string;
}

export const CategoryDetailView = ({ category, onBack, onEdit, onDelete, userId }: CategoryDetailViewProps) => {
  const { transactions, projects, getCategoryById } = useFinanceStore();
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());

  const categoryStats = useMemo(() => {
    const catTransactions = transactions.filter((t: Transaction) => t.categoryId === category.id);
    const projectIds = new Set<string>();
    catTransactions.forEach(t => { if (t.projectId) projectIds.add(t.projectId); });
    catTransactions.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    const total = catTransactions.reduce((sum, t) => sum + t.amount, 0);
    return { total, count: catTransactions.length, projectIds, all: catTransactions };
  }, [transactions, category.id]);

  const toggleProjectFilter = (pid: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  const filteredTransactions = useMemo(() => {
    if (selectedProjectIds.size === 0) return categoryStats.all;
    return categoryStats.all.filter(t => t.projectId && selectedProjectIds.has(t.projectId));
  }, [categoryStats.all, selectedProjectIds]);

  const filteredTotal = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const filteredCount = filteredTransactions.length;

  const IconComp = getIconComponent(category.icon);
  const formatAmount = (amount: number) => `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN')}`;

  return (
    <div className={cn("min-h-screen bg-background", isEditSheetOpen && "hidden")}>
      <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 safe-top border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold truncate">{category.name}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-2 hover:bg-muted rounded-lg">
            <Pencil size={16} className="text-muted-foreground" />
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-destructive/10 rounded-lg">
            <Trash2 size={16} className="text-destructive" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header card */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <IconComp size={22} style={{ color: category.color }} />
          </div>
          <div>
            <p className="font-semibold text-lg">{category.name}</p>
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium",
                category.type === 'income' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              )}>
                {category.type === 'income' ? 'Income' : 'Expense'}
              </span>
              <p className="text-sm text-muted-foreground">
                {filteredCount} transaction{filteredCount !== 1 ? 's' : ''} · {formatAmount(filteredTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Projects filter chips */}
        {categoryStats.projectIds.size > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Projects</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedProjectIds(new Set())}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer",
                  selectedProjectIds.size === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                All
              </button>
              {Array.from(categoryStats.projectIds).map(pid => {
                const proj = projects.find(p => p.id === pid);
                if (!proj) return null;
                const isSelected = selectedProjectIds.has(pid);
                return (
                  <button
                    key={pid}
                    onClick={() => toggleProjectFilter(pid)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer",
                      isSelected
                        ? "text-white"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                    style={isSelected ? { backgroundColor: proj.color || 'hsl(var(--primary))' } : undefined}
                  >
                    {proj.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* All transactions */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {selectedProjectIds.size > 0 ? 'Filtered Transactions' : 'All Transactions'}
          </p>
          <div className="space-y-1.5">
            {filteredTransactions.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                category={getCategoryById(t.categoryId)}
                userId={userId}
                compact
                onEditSheetChange={setIsEditSheetOpen}
              />
            ))}
            {filteredCount === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No transactions found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

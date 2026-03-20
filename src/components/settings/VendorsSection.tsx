import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, icons, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TransactionItem } from "@/components/TransactionItem";
interface VendorsSectionProps {
  onBack: () => void;
  userId?: string;
  isEmployee?: boolean;
}

const VENDOR_COLORS = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
  '#84CC16', // lime
];

const VENDOR_ICONS = [
  'Store', 'ShoppingBag', 'Coffee', 'Utensils', 'Car', 'Fuel', 
  'Home', 'Building2', 'Briefcase', 'Plane', 'Train', 'Bus',
  'Heart', 'Gift', 'Music', 'Film', 'Gamepad2', 'Dumbbell',
  'Pill', 'Stethoscope', 'GraduationCap', 'Book', 'Laptop', 'Smartphone'
];

export const VendorsSection = ({ onBack, userId, isEmployee }: VendorsSectionProps) => {
  const { vendors, addVendor, updateVendor, deleteVendor, transactions, updateTransaction, projects, getCategoryById } = useFinanceStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [selectedColor, setSelectedColor] = useState(VENDOR_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('Store');
  const [detailVendorName, setDetailVendorName] = useState<string | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Combine stored vendors with transaction vendors, ensuring all are editable
  const allVendors = useMemo(() => {
    const storedVendorNames = new Set(vendors.map(v => v.name));
    const transactionVendorNames = Array.from(new Set(transactions.map(t => t.vendor)));
    
    // Add any missing transaction vendors to a combined list
    const combinedVendors = [...vendors];
    
    transactionVendorNames.forEach(vendorName => {
      if (!storedVendorNames.has(vendorName)) {
        combinedVendors.push({ id: `legacy-${vendorName}`, name: vendorName });
      }
    });
    
    return combinedVendors;
  }, [vendors, transactions]);

  // Compute vendor stats from transactions
  const vendorStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number; projectIds: Set<string>; all: Transaction[] }> = {};
    const txns = isEmployee && userId ? transactions.filter(t => t.userId === userId) : transactions;
    txns.forEach((t: Transaction) => {
      const key = t.vendor;
      if (!key) return;
      if (!stats[key]) stats[key] = { total: 0, count: 0, projectIds: new Set(), all: [] };
      stats[key].total += t.amount;
      stats[key].count += 1;
      if (t.projectId) stats[key].projectIds.add(t.projectId);
      stats[key].all.push(t);
    });
    Object.values(stats).forEach(s => {
      s.all.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    });
    return stats;
  }, [transactions, isEmployee, userId]);

  const formatAmount = (amount: number) => `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN')}`;

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Please enter a vendor name");
      return;
    }
    if (allVendors.some(v => v.name.toLowerCase() === name.trim().toLowerCase())) {
      toast.error("Vendor already exists");
      return;
    }
    addVendor(name.trim(), selectedColor, selectedIcon, userId);
    toast.success("Vendor added");
    setShowAddForm(false);
    setName('');
    setSelectedColor(VENDOR_COLORS[0]);
    setSelectedIcon('Store');
  };

  const handleUpdate = (id: string) => {
    if (!name.trim()) {
      toast.error("Please enter a vendor name");
      return;
    }
    
    // Check for duplicate name, excluding the current vendor being edited
    const trimmedName = name.trim().toLowerCase();
    const isDuplicate = allVendors.some(v => 
      v.name.toLowerCase() === trimmedName && 
      v.name.toLowerCase() !== originalName.toLowerCase()
    );
    
    if (isDuplicate) {
      toast.error("A vendor with this name already exists");
      return;
    }
    
    if (id.startsWith('legacy-')) {
      // For legacy vendors, we need to:
      // 1. Create a new vendor entry
      // 2. Update all transactions with the old name to use the new name
      const oldName = originalName;
      const newName = name.trim();
      
      // Add the new vendor
      addVendor(newName, selectedColor, selectedIcon, userId);
      
      // Update transactions if name changed
      if (oldName && newName !== oldName) {
        const transactionsToUpdate = transactions.filter((t: Transaction) => t.vendor === oldName);
        transactionsToUpdate.forEach((t: Transaction) => {
          updateTransaction(t.id, { vendor: newName }, userId);
        });
      }
    } else {
      updateVendor(id, { name: name.trim(), color: selectedColor, icon: selectedIcon }, userId);
    }
    toast.success("Vendor updated");
    setEditingId(null);
    setOriginalName('');
    setName('');
    setSelectedColor(VENDOR_COLORS[0]);
    setSelectedIcon('Store');
  };

  const handleDelete = () => {
    if (deleteId) {
      if (!deleteId.startsWith('legacy-')) {
        deleteVendor(deleteId, userId);
      }
      toast.success("Vendor deleted");
      setDeleteId(null);
    }
  };

  const startEdit = (vendorId: string, vendorName: string, vendorColor?: string, vendorIcon?: string) => {
    setEditingId(vendorId);
    setOriginalName(vendorName);
    setName(vendorName);
    setSelectedColor(vendorColor || VENDOR_COLORS[0]);
    setSelectedIcon(vendorIcon || 'Store');
  };

  const renderIcon = (iconName: string, color: string, size: number = 18) => {
    const IconComponent = icons[iconName as keyof typeof icons];
    if (!IconComponent) {
      const FallbackIcon = icons['Store'];
      return <FallbackIcon size={size} style={{ color }} />;
    }
    return <IconComponent size={size} style={{ color }} />;
  };

  const VendorForm = ({ isEdit = false, vendorId = '' }: { isEdit?: boolean; vendorId?: string }) => (
    <div className="space-y-4">
      <Input
        placeholder="Vendor name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      
      {/* Color Selection */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Color</Label>
        <div className="flex flex-wrap gap-2">
          {VENDOR_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-9 h-9 rounded-full transition-all ${
                selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      
      {/* Icon Selection */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Icon</Label>
        <div className="grid grid-cols-8 gap-1.5">
          {VENDOR_ICONS.map((iconName) => (
            <button
              key={iconName}
              onClick={() => setSelectedIcon(iconName)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                selectedIcon === iconName 
                  ? 'ring-2 ring-primary bg-primary/10' 
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              {renderIcon(iconName, selectedIcon === iconName ? selectedColor : 'hsl(var(--muted-foreground))', 16)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button 
          variant="outline" 
          onClick={() => {
            if (isEdit) setEditingId(null);
            else setShowAddForm(false);
            setName('');
            setOriginalName('');
            setSelectedColor(VENDOR_COLORS[0]);
            setSelectedIcon('Store');
          }} 
          className="flex-1"
        >
          Cancel
        </Button>
        <Button onClick={() => isEdit ? handleUpdate(vendorId) : handleAdd()} className="flex-1">
          <Check size={16} className="mr-1" /> {isEdit ? 'Save' : 'Add'}
        </Button>
      </div>
    </div>
  );

  // Detail view for a single vendor
  const detailStats = detailVendorName ? vendorStats[detailVendorName] : null;
  const detailVendorObj = detailVendorName ? allVendors.find(v => v.name === detailVendorName) : null;

  // Reset filter when vendor changes
  const handleSetDetailVendor = (name: string | null) => {
    setDetailVendorName(name);
    setSelectedProjectIds(new Set());
  };

  const toggleProjectFilter = (pid: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  // Filtered transactions for detail view
  const filteredDetailTransactions = useMemo(() => {
    if (!detailStats) return [];
    if (selectedProjectIds.size === 0) return detailStats.all;
    return detailStats.all.filter(t => t.projectId && selectedProjectIds.has(t.projectId));
  }, [detailStats, selectedProjectIds]);

  const filteredTotal = filteredDetailTransactions.reduce((sum, t) => sum + t.amount, 0);
  const filteredCount = filteredDetailTransactions.length;

  if (detailVendorName && detailStats) {
    return (
      <div className={cn("min-h-screen bg-background", isEditSheetOpen && "hidden")}>
        <div className="sticky top-0 bg-background z-10 flex items-center gap-3 p-4 safe-top border-b border-border">
          <button onClick={() => handleSetDetailVendor(null)} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold truncate">{detailVendorName}</h1>
        </div>

        <div className="p-4 space-y-4">
          {/* Header card */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: detailVendorObj?.color ? `${detailVendorObj.color}20` : 'hsl(var(--success) / 0.1)' }}
            >
              {renderIcon(detailVendorObj?.icon || 'Store', detailVendorObj?.color || 'hsl(var(--success))', 22)}
            </div>
            <div>
              <p className="font-semibold text-lg">{detailVendorName}</p>
              <p className="text-sm text-muted-foreground">
                {filteredCount} transaction{filteredCount !== 1 ? 's' : ''} &middot; {formatAmount(filteredTotal)}
              </p>
            </div>
          </div>

          {/* Projects filter chips */}
          {detailStats.projectIds.size > 0 && (
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
                {Array.from(detailStats.projectIds).map(pid => {
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
              {filteredDetailTransactions.map((t) => (
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
                <p className="text-center text-sm text-muted-foreground py-4">No transactions for selected projects</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 safe-top border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Vendors</h1>
        </div>
        {!isEmployee && (
          <Button size="sm" onClick={() => { setShowAddForm(true); setName(''); setSelectedColor(VENDOR_COLORS[0]); setSelectedIcon('Store'); }}>
            <Plus size={16} className="mr-1" /> Add
          </Button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Search */}
        {allVendors.length > 5 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors..."
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
                <h3 className="font-semibold">New Vendor</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-muted rounded">
                  <X size={18} />
                </button>
              </div>
              <VendorForm />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vendors List */}
        {allVendors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No vendors yet. Add your first vendor!
          </div>
        ) : (
          <>
          {allVendors
            .filter(v => !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((vendor) => {
            const stats = vendorStats[vendor.name];
            const isExpanded = expandedId === vendor.id;
            return (
              <motion.div
                key={vendor.id}
                layout
                className="bg-card rounded-xl border border-border"
              >
                {editingId === vendor.id ? (
                  <div className="p-4">
                    <VendorForm isEdit vendorId={vendor.id} />
                  </div>
                ) : (
                  <>
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left"
                      onClick={() => setExpandedId(isExpanded ? null : vendor.id)}
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: vendor.color ? `${vendor.color}20` : 'hsl(var(--success) / 0.1)' }}
                      >
                        {renderIcon(vendor.icon || 'Store', vendor.color || 'hsl(var(--success))')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium truncate">{vendor.name}</p>
                          {vendor.name === 'Not Specified' && (
                            <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded shrink-0">Default</span>
                          )}
                        </div>
                        {stats && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {stats.count} transaction{stats.count !== 1 ? 's' : ''} &middot; {formatAmount(stats.total)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {vendor.name !== 'Not Specified' && (
                          <button onClick={(e) => { e.stopPropagation(); startEdit(vendor.id, vendor.name, vendor.color, vendor.icon); }} className="p-2 hover:bg-muted rounded-lg">
                            <Pencil size={16} className="text-muted-foreground" />
                          </button>
                        )}
                        {vendor.name !== 'Not Specified' && (
                          <button onClick={(e) => { e.stopPropagation(); setDeleteId(vendor.id); }} className="p-2 hover:bg-destructive/10 rounded-lg">
                            <Trash2 size={16} className="text-destructive" />
                          </button>
                        )}
                        {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && stats && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-border"
                        >
                          <div className="p-4 pt-3 space-y-3">
                            {stats.projectIds.size > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1.5">Projects</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {Array.from(stats.projectIds).map(pid => {
                                    const proj = projects.find(p => p.id === pid);
                                    return proj ? (
                                      <span key={pid} className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium">{proj.name}</span>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Recent</p>
                              <div className="space-y-1.5">
                                {stats.all.slice(0, 5).map((t) => (
                                  <TransactionItem
                                    key={t.id}
                                    transaction={t}
                                    category={getCategoryById(t.categoryId)}
                                    userId={userId}
                                    compact
                                    onEditSheetChange={setIsEditSheetOpen}
                                  />
                                ))}
                              </div>
                              {stats.count > 5 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full mt-2 text-xs text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetDetailVendor(vendor.name);
                                  }}
                                >
                                  View All ({stats.count})
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            );
          })}
          </>
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Vendor"
        description="This will remove the vendor from your list."
      />
    </div>
  );
};

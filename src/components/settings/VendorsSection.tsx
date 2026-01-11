import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, icons } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VendorsSectionProps {
  onBack: () => void;
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

export const VendorsSection = ({ onBack }: VendorsSectionProps) => {
  const { vendors, addVendor, updateVendor, deleteVendor, transactions } = useFinanceStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(VENDOR_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('Store');

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

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Please enter a vendor name");
      return;
    }
    if (allVendors.some(v => v.name.toLowerCase() === name.trim().toLowerCase())) {
      toast.error("Vendor already exists");
      return;
    }
    addVendor(name.trim(), selectedColor, selectedIcon);
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
    
    if (id.startsWith('legacy-')) {
      addVendor(name.trim(), selectedColor, selectedIcon);
    } else {
      updateVendor(id, { name: name.trim(), color: selectedColor, icon: selectedIcon });
    }
    toast.success("Vendor updated");
    setEditingId(null);
    setName('');
    setSelectedColor(VENDOR_COLORS[0]);
    setSelectedIcon('Store');
  };

  const handleDelete = () => {
    if (deleteId) {
      if (!deleteId.startsWith('legacy-')) {
        deleteVendor(deleteId);
      }
      toast.success("Vendor deleted");
      setDeleteId(null);
    }
  };

  const startEdit = (vendorId: string, vendorName: string, vendorColor?: string, vendorIcon?: string) => {
    setEditingId(vendorId);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Vendors</h1>
        </div>
        <Button size="sm" onClick={() => { setShowAddForm(true); setName(''); setSelectedColor(VENDOR_COLORS[0]); setSelectedIcon('Store'); }}>
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
          allVendors.map((vendor) => (
            <motion.div
              key={vendor.id}
              layout
              className="bg-card rounded-xl border border-border p-4"
            >
              {editingId === vendor.id ? (
                <VendorForm isEdit vendorId={vendor.id} />
              ) : (
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: vendor.color ? `${vendor.color}20` : 'hsl(var(--success) / 0.1)' }}
                  >
                    {renderIcon(vendor.icon || 'Store', vendor.color || 'hsl(var(--success))')}
                  </div>
                  <p className="font-medium flex-1 truncate">{vendor.name}</p>
                  <button onClick={() => startEdit(vendor.id, vendor.name, vendor.color, vendor.icon)} className="p-2 hover:bg-muted rounded-lg">
                    <Pencil size={16} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => setDeleteId(vendor.id)} className="p-2 hover:bg-destructive/10 rounded-lg">
                    <Trash2 size={16} className="text-destructive" />
                  </button>
                </div>
              )}
            </motion.div>
          ))
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

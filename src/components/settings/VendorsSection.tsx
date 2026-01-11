import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Store } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";

interface VendorsSectionProps {
  onBack: () => void;
}

export const VendorsSection = ({ onBack }: VendorsSectionProps) => {
  const { vendors, addVendor, updateVendor, deleteVendor, transactions } = useFinanceStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');

  // Combine stored vendors with transaction vendors, ensuring all are editable
  const allVendors = useMemo(() => {
    const storedVendorNames = new Set(vendors.map(v => v.name));
    const transactionVendorNames = Array.from(new Set(transactions.map(t => t.vendor)));
    
    // Add any missing transaction vendors to a combined list
    const combinedVendors = [...vendors];
    
    transactionVendorNames.forEach(vendorName => {
      if (!storedVendorNames.has(vendorName)) {
        // These are "legacy" vendors from transactions - we'll allow editing but will add them to store first
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
    addVendor(name.trim());
    toast.success("Vendor added");
    setShowAddForm(false);
    setName('');
  };

  const handleUpdate = (id: string, originalName: string) => {
    if (!name.trim()) {
      toast.error("Please enter a vendor name");
      return;
    }
    
    // If this is a legacy vendor, add it to the store first
    if (id.startsWith('legacy-')) {
      addVendor(name.trim());
    } else {
      updateVendor(id, name.trim());
    }
    toast.success("Vendor updated");
    setEditingId(null);
    setName('');
  };

  const handleDelete = () => {
    if (deleteId) {
      // Only delete from store if it's a stored vendor
      if (!deleteId.startsWith('legacy-')) {
        deleteVendor(deleteId);
      }
      toast.success("Vendor deleted");
      setDeleteId(null);
    }
  };

  const startEdit = (vendorId: string, vendorName: string) => {
    setEditingId(vendorId);
    setName(vendorName);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Vendors</h1>
        </div>
        <Button size="sm" onClick={() => { setShowAddForm(true); setName(''); }}>
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
                <h3 className="font-semibold">New Vendor</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-muted rounded">
                  <X size={18} />
                </button>
              </div>
              <Input
                placeholder="Vendor name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button onClick={handleAdd} className="w-full">
                <Check size={16} className="mr-1" /> Add Vendor
              </Button>
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
                <div className="space-y-4">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Vendor name"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={() => handleUpdate(vendor.id, vendor.name)} className="flex-1">
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Store size={18} className="text-success" />
                  </div>
                  <p className="font-medium flex-1">{vendor.name}</p>
                  <button onClick={() => startEdit(vendor.id, vendor.name)} className="p-2 hover:bg-muted rounded-lg">
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

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Users, Edit2, Trash2, Banknote, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinanceStore } from "@/lib/store";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PartnerBalanceCard } from "@/components/PartnerBalanceCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PartnersSectionProps {
  onBack: () => void;
  userId?: string;
}

const PARTNER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export const PartnersSection = ({ onBack, userId }: PartnersSectionProps) => {
  const { partners, addPartner, updatePartner, deletePartner, getPartnerBalances } = useFinanceStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState(PARTNER_COLORS[0]);
  const [initialCash, setInitialCash] = useState("");
  const [initialOnline, setInitialOnline] = useState("");
  
  const partnerBalances = getPartnerBalances();
  
  const resetForm = () => {
    setName("");
    setColor(PARTNER_COLORS[0]);
    setInitialCash("");
    setInitialOnline("");
    setEditingPartner(null);
  };
  
  const handleAdd = () => {
    if (!name.trim()) return;
    
    addPartner({
      name: name.trim(),
      color,
      initialCashBalance: parseFloat(initialCash) || 0,
      initialOnlineBalance: parseFloat(initialOnline) || 0,
    }, userId);
    
    resetForm();
    setIsAddOpen(false);
  };
  
  const handleEdit = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;
    
    setName(partner.name);
    setColor(partner.color);
    setInitialCash(partner.initialCashBalance.toString());
    setInitialOnline(partner.initialOnlineBalance.toString());
    setEditingPartner(partnerId);
  };
  
  const handleUpdate = () => {
    if (!editingPartner || !name.trim()) return;
    
    updatePartner(editingPartner, {
      name: name.trim(),
      color,
      initialCashBalance: parseFloat(initialCash) || 0,
      initialOnlineBalance: parseFloat(initialOnline) || 0,
    }, userId);
    
    resetForm();
  };
  
  const handleDelete = (partnerId: string) => {
    if (confirm('Delete this partner? Transactions will be unassigned.')) {
      deletePartner(partnerId, userId);
    }
  };
  
  const PartnerForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Partner 1"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Color</Label>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {PARTNER_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-10 h-10 rounded-full transition-all",
                color === c && "ring-2 ring-offset-2 ring-primary"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Initial Cash Balance
        </Label>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-muted-foreground">{CURRENCY_SYMBOL}</span>
          <Input
            type="number"
            value={initialCash}
            onChange={(e) => setInitialCash(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Initial Online Balance
        </Label>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-muted-foreground">{CURRENCY_SYMBOL}</span>
          <Input
            type="number"
            value={initialOnline}
            onChange={(e) => setInitialOnline(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      
      <Button 
        onClick={isEdit ? handleUpdate : handleAdd}
        disabled={!name.trim()}
        className="w-full"
      >
        {isEdit ? 'Update Partner' : 'Add Partner'}
      </Button>
    </div>
  );
  
  return (
    <div className="min-h-screen pb-24">
      <div className="p-4 pt-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Partners</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1 ml-8">
          Track money held by each partner
        </p>
      </div>
      
      {/* Partner Balance Card */}
      <div className="px-4 mb-4">
        <PartnerBalanceCard />
      </div>
      
      {/* Partner List */}
      <div className="px-4 space-y-3">
        {partnerBalances.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Users size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No partners added yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add partners to track who holds the money</p>
          </div>
        ) : (
          partnerBalances.map(({ partner, cashBalance, onlineBalance }) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-4 border border-border"
            >
              {editingPartner === partner.id ? (
                <div className="space-y-3">
                  <PartnerForm isEdit />
                  <Button variant="outline" onClick={resetForm} className="w-full">
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: partner.color }}
                      >
                        {partner.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold">{partner.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEdit(partner.id)}
                        className="p-2 rounded-full hover:bg-muted"
                      >
                        <Edit2 size={16} className="text-muted-foreground" />
                      </button>
                      <button 
                        onClick={() => handleDelete(partner.id)}
                        className="p-2 rounded-full hover:bg-destructive/10"
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Banknote size={14} />
                        <span className="text-xs">Cash</span>
                      </div>
                      <p className={cn(
                        "text-lg font-bold",
                        cashBalance >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {CURRENCY_SYMBOL}{Math.abs(cashBalance).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <CreditCard size={14} />
                        <span className="text-xs">Online</span>
                      </div>
                      <p className={cn(
                        "text-lg font-bold",
                        onlineBalance >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {CURRENCY_SYMBOL}{Math.abs(onlineBalance).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>
      
      {/* Add Partner Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-24 right-4 rounded-full w-14 h-14 shadow-lg z-40">
            <Plus size={24} />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Partner</DialogTitle>
          </DialogHeader>
          <PartnerForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

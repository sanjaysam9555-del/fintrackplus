import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Users, Edit2, Trash2, Banknote, CreditCard, CalendarIcon, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinanceStore } from "@/lib/store";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PartnerDetailSheet } from "./PartnerDetailSheet";
import { Partner } from "@/lib/types";

interface PartnersSectionProps {
  onBack: () => void;
  userId?: string;
}

const PARTNER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

type TimeFilter = 'fy' | 'week' | 'month' | 'year' | 'custom';

export const PartnersSection = ({ onBack, userId }: PartnersSectionProps) => {
  const { partners, addPartner, updatePartner, deletePartner, getPartnerBalancesForPeriod } = useFinanceStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('fy');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  
  // Detail sheet state
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState(PARTNER_COLORS[0]);
  const [initialCash, setInitialCash] = useState("");
  const [initialOnline, setInitialOnline] = useState("");
  
  const dateRange = useMemo(() => {
    const today = new Date();
    const start = new Date();
    
    switch (timeFilter) {
      case 'fy': {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
        return {
          start: `${fyStartYear}-04-01`,
          end: `${fyStartYear + 1}-03-31`,
        };
      }
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: format(customStartDate, 'yyyy-MM-dd'),
            end: format(customEndDate, 'yyyy-MM-dd'),
          };
        }
        start.setMonth(today.getMonth() - 1);
        break;
      default:
        start.setMonth(today.getMonth() - 1);
    }
    
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(today, 'yyyy-MM-dd'),
    };
  }, [timeFilter, customStartDate, customEndDate]);
  
  const partnerBalances = useMemo(() => {
    return getPartnerBalancesForPeriod(dateRange.start, dateRange.end);
  }, [getPartnerBalancesForPeriod, dateRange]);
  
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
  
  const handleDelete = (partnerId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Delete this partner? Transactions will be unassigned.')) {
      deletePartner(partnerId, userId);
    }
  };
  
  const handleEditClick = (partnerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleEdit(partnerId);
  };
  
  const openPartnerDetail = (balanceData: typeof partnerBalances[0]) => {
    setSelectedPartner(balanceData.partner);
    setIsDetailOpen(true);
  };
  
  const getFilterLabel = () => {
    if (timeFilter === 'fy') {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
      return `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
    }
    if (timeFilter === 'week') return 'This Week';
    if (timeFilter === 'month') return 'This Month';
    if (timeFilter === 'year') return 'This Year';
    if (timeFilter === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'MMM dd')} - ${format(customEndDate, 'MMM dd')}`;
    }
    return 'Custom';
  };
  
  const selectedBalanceData = selectedPartner 
    ? partnerBalances.find(b => b.partner.id === selectedPartner.id) || null
    : null;
  
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
          Starting Cash Balance
        </Label>
        <p className="text-[10px] text-muted-foreground mt-0.5 mb-1">
          Amount before any recorded transactions
        </p>
        <div className="flex items-center gap-2">
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
          Starting Online Balance
        </Label>
        <p className="text-[10px] text-muted-foreground mt-0.5 mb-1">
          Amount before any recorded transactions
        </p>
        <div className="flex items-center gap-2">
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
      
      {/* Explanatory Info Box */}
      <div className="px-4 mb-4">
        <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">How balances work:</p>
              <p>• <span className="text-foreground">Opening</span> = Initial balance + transactions before period</p>
              <p>• <span className="text-success">+ Income</span> received during period</p>
              <p>• <span className="text-destructive">− Expenses</span> made during period</p>
              <p>• <span className="text-foreground">Closing</span> = Current holdings</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time Filter Tabs */}
      <div className="px-4 mb-4">
        <div className="flex p-1 bg-muted rounded-xl">
          {(['fy', 'week', 'month', 'year', 'custom'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                "flex-1 py-2 rounded-lg font-medium transition-colors capitalize text-sm",
                timeFilter === filter 
                  ? "bg-card shadow-sm" 
                  : "text-muted-foreground"
              )}
            >
              {filter === 'fy' ? 'FY' : filter === 'week' ? 'Week' : filter === 'month' ? 'Month' : filter === 'year' ? 'Year' : 'Custom'}
            </button>
          ))}
        </div>
        
        {/* Custom Date Range Picker */}
        {timeFilter === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex gap-2"
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !customStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customStartDate ? format(customStartDate, "MMM dd, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card z-[60]" align="start">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !customEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customEndDate ? format(customEndDate, "MMM dd, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card z-[60]" align="end">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </motion.div>
        )}
      </div>
      
      {/* Period Label */}
      <div className="px-4 mb-4">
        <p className="text-sm text-muted-foreground">
          Showing balances for: <span className="font-medium text-foreground">{getFilterLabel()}</span>
        </p>
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
          partnerBalances.map((balanceData) => {
            const { 
              partner, 
              closingCashBalance,
              closingOnlineBalance,
              periodCashTxnCount,
              periodOnlineTxnCount,
            } = balanceData;
            
            const totalTxnCount = periodCashTxnCount + periodOnlineTxnCount;
            const totalClosing = closingCashBalance + closingOnlineBalance;
            
            return (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => editingPartner !== partner.id && openPartnerDetail(balanceData)}
                className={cn(
                  "bg-card rounded-2xl p-4 border border-border transition-colors",
                  editingPartner !== partner.id && "cursor-pointer hover:border-primary/50 active:bg-muted/30"
                )}
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
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: partner.color }}
                        >
                          {partner.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold">{partner.name}</span>
                          <p className="text-xs text-muted-foreground">
                            {totalTxnCount} transaction{totalTxnCount !== 1 ? 's' : ''} this period
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => handleEditClick(partner.id, e)}
                          className="p-2 rounded-full hover:bg-muted"
                        >
                          <Edit2 size={16} className="text-muted-foreground" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(partner.id, e)}
                          className="p-2 rounded-full hover:bg-destructive/10"
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </button>
                        <ChevronRight size={18} className="text-muted-foreground ml-1" />
                      </div>
                    </div>
                    
                    {/* Balance Summary Row */}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Banknote size={14} className="text-muted-foreground" />
                        <span className={cn(
                          "font-semibold",
                          closingCashBalance >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {closingCashBalance < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(closingCashBalance).toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({periodCashTxnCount})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-muted-foreground" />
                        <span className={cn(
                          "font-semibold",
                          closingOnlineBalance >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {closingOnlineBalance < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(closingOnlineBalance).toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({periodOnlineTxnCount})
                        </span>
                      </div>
                    </div>
                    
                    {/* Total & Hint */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Total: <span className={cn(
                          "font-semibold",
                          totalClosing >= 0 ? "text-foreground" : "text-destructive"
                        )}>
                          {totalClosing < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(totalClosing).toLocaleString()}
                        </span>
                      </span>
                      <span className="text-xs text-primary">Tap to view transactions →</span>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })
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
      
      {/* Partner Detail Sheet */}
      <PartnerDetailSheet
        partner={selectedPartner}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedPartner(null);
        }}
        dateRange={dateRange}
        balanceData={selectedBalanceData}
        periodLabel={getFilterLabel()}
        userId={userId}
      />
    </div>
  );
};
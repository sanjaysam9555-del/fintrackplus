import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, CreditCard, Banknote, CalendarIcon, Check, Settings, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinanceStore } from "@/lib/store";
import { Transaction, TransactionType, PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { renderCategoryIcon, renderVendorIcon } from "@/lib/iconUtils";
import { appPath } from "@/lib/domainUtils";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ReceiptUpload } from "./ReceiptUpload";
import { GstToggle } from "./GstToggle";

interface EditTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  userId?: string;
}

export const EditTransactionSheet = ({ isOpen, onClose, transaction, userId }: EditTransactionSheetProps) => {
  const navigate = useNavigate();
  const { categories, projects, transactions, vendors, partners, updateTransaction } = useFinanceStore();
  
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [title, setTitle] = useState(transaction.title || "");
  const [vendor, setVendor] = useState(transaction.vendor);
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [projectId, setProjectId] = useState(transaction.projectId || "");
  const [partnerId, setPartnerId] = useState(transaction.partnerId || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction.paymentMethod);
  const [date, setDate] = useState<Date>(parseISO(transaction.date));
  const [notes, setNotes] = useState(transaction.notes || "");
  const [showCategories, setShowCategories] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showPartners, setShowPartners] = useState(false);
  const [showVendors, setShowVendors] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(transaction.receiptUrl);
  const [isGst, setIsGst] = useState(transaction.isGst || false);


  // Reset state when transaction changes
  useEffect(() => {
    setType(transaction.type);
    setAmount(transaction.amount.toString());
    setTitle(transaction.title || "");
    setVendor(transaction.vendor);
    setCategoryId(transaction.categoryId);
    setProjectId(transaction.projectId || "");
    setPartnerId(transaction.partnerId || "");
    setPaymentMethod(transaction.paymentMethod);
    setDate(parseISO(transaction.date));
    setNotes(transaction.notes || "");
    setReceiptUrl(transaction.receiptUrl);
    setIsGst(transaction.isGst || false);
  }, [transaction]);
  
  const filteredCategories = categories.filter(c => c.type === type);
  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedProject = projects.find(p => p.id === projectId);
  const selectedPartner = partners.find(p => p.id === partnerId);
  
  // Get all vendors from both store and transactions
  const allVendors = useMemo(() => {
    const storedVendors = vendors;
    const transactionVendorNames = Array.from(new Set(transactions.map(t => t.vendor)));
    
    const vendorMap = new Map<string, { name: string; icon?: string; color?: string }>();
    
    transactionVendorNames.forEach(name => {
      vendorMap.set(name.toLowerCase(), { name });
    });
    
    storedVendors.forEach(v => {
      vendorMap.set(v.name.toLowerCase(), { name: v.name, icon: v.icon, color: v.color });
    });
    
    return Array.from(vendorMap.values());
  }, [vendors, transactions]);
  
  const selectedVendorDetails = useMemo(() => {
    return allVendors.find(v => v.name.toLowerCase() === vendor.toLowerCase());
  }, [allVendors, vendor]);
  
  const isPartnerTransfer = transaction.vendor === 'Partner Transfer';

  const handleSubmit = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!amount || !categoryId) return;
    
    if (isPartnerTransfer) {
      toast.error('Transfer entries cannot be edited', {
        description: 'Please delete and re-create the transfer instead.',
        duration: 4000,
      });
      return;
    }
    
    await updateTransaction(transaction.id, {
      type,
      amount: parseFloat(amount),
      title: title || undefined,
      vendor: vendor || 'Not Specified',
      categoryId,
      projectId: projectId || undefined,
      partnerId: partnerId || undefined,
      paymentMethod,
      date: format(date, 'yyyy-MM-dd'),
      notes: notes || undefined,
      receiptUrl: receiptUrl || undefined,
      isGst: isGst || undefined,
    }, userId);
    
    // Show success confirmation
    toast.success('Transaction Updated', {
      description: `₹${parseFloat(amount).toLocaleString()} ${title ? `- ${title}` : ''}`,
      duration: 3000,
    });
    
    onClose();
  };
  
  // Use portal to render at document body level, ensuring fixed positioning works correctly
  // regardless of scroll position in parent containers
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[80]"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[80] bg-card rounded-t-3xl max-h-[85vh] overflow-hidden"
          >
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-muted rounded-full" />
            </div>
            
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold">Edit Transaction</h2>
              <div className="flex items-center gap-2">
                {isPartnerTransfer ? (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                    Transfer (read-only)
                  </Badge>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!amount || !categoryId}
                    size="sm"
                    className="gradient-primary text-primary-foreground"
                  >
                    Save Changes
                  </Button>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }} 
                  className="p-2 rounded-full hover:bg-muted"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-scroll overscroll-contain touch-pan-y" data-vaul-no-drag style={{ WebkitOverflowScrolling: 'touch', maxHeight: 'calc(85vh - 140px)' }}>
              <div className="p-4 space-y-4 pb-8">
                {/* Type Toggle */}
                <div className="flex gap-2 p-1 bg-muted rounded-xl">
                  <button
                    onClick={() => setType('expense')}
                    className={cn(
                      "flex-1 py-2 rounded-lg font-medium transition-colors",
                      type === 'expense' 
                        ? "bg-destructive text-destructive-foreground" 
                        : "text-muted-foreground"
                    )}
                  >
                    Expense
                  </button>
                  <button
                    onClick={() => setType('income')}
                    className={cn(
                      "flex-1 py-2 rounded-lg font-medium transition-colors",
                      type === 'income' 
                        ? "bg-success text-success-foreground" 
                        : "text-muted-foreground"
                    )}
                  >
                    Income
                  </button>
                </div>
                
                {/* Title */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Title <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={type === 'expense' ? 'e.g., Office supplies' : 'e.g., Monthly salary'}
                    className="mt-1"
                  />
                </div>
                
                {/* Amount */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Amount *</Label>
                  <div className="flex items-center gap-2 mt-1 border-b-2 border-primary pb-2">
                    <span className="text-xl font-bold text-muted-foreground">{CURRENCY_SYMBOL}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="flex-1 text-2xl font-bold bg-transparent outline-none"
                    />
                  </div>
                </div>
                
                {/* Category Dropdown */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Category *</Label>
                  <Popover open={showCategories} onOpenChange={(open) => {
                    setShowCategories(open);
                    if (!open) setCategorySearch("");
                  }}>
                    <PopoverTrigger asChild>
                      <button className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center justify-between min-h-[48px]">
                        {selectedCategory ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-md flex items-center justify-center"
                              style={{ backgroundColor: `${selectedCategory.color}20` }}
                            >
                              {renderCategoryIcon(selectedCategory.icon, selectedCategory.color)}
                            </div>
                            <span className="text-sm font-medium truncate">{selectedCategory.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Select category...</span>
                        )}
                        <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-72 p-2 bg-card z-[90]" align="start" sideOffset={8} onOpenAutoFocus={(e) => e.preventDefault()}>
                      <div className="relative mb-2">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="Search categories..."
                          className="pl-8 h-8 text-base"
                        />
                      </div>
                      <div className="max-h-[40vh] overflow-y-auto overscroll-contain touch-pan-y">
                        <div className="space-y-1">
                          {filteredCategories.filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase())).length > 0 ? (
                            <>
                              {filteredCategories.filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => (
                                <button
                                  key={cat.id}
                                  onClick={() => {
                                    setCategoryId(cat.id);
                                    setShowCategories(false);
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors",
                                    categoryId === cat.id ? "bg-primary/10" : "hover:bg-muted"
                                  )}
                                >
                                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                                    {renderCategoryIcon(cat.icon, cat.color)}
                                  </div>
                                  <span className="text-sm font-medium flex-1 text-left">{cat.name}</span>
                                  <Check size={14} className={cn("text-primary shrink-0", categoryId === cat.id ? "opacity-100" : "opacity-0")} />
                                </button>
                              ))}
                              <button
                                onClick={() => {
                                  setShowCategories(false);
                                  onClose();
                                  navigate(appPath('/?tab=settings'));
                                }}
                                className="w-full px-3 py-2 text-xs text-primary hover:text-primary/80 text-center border-t border-border mt-2 pt-2 flex items-center justify-center gap-1 transition-colors"
                              >
                                <Settings size={12} />
                                To add more categories, go to Settings
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setShowCategories(false);
                                onClose();
                                navigate(appPath('/?tab=settings'));
                              }}
                              className="w-full px-3 py-4 text-center text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              No categories added yet.<br />
                              <span className="text-xs text-primary flex items-center justify-center gap-1 mt-1">
                                <Settings size={12} />
                                Add categories in Settings
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Date Picker */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date</Label>
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <button className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center justify-between min-h-[48px]">
                        <span className="text-sm font-medium">{format(date, 'MMM dd, yyyy')}</span>
                        <CalendarIcon size={16} className="text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card z-[90]" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => {
                          if (d) setDate(d);
                          setShowDatePicker(false);
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Vendor Dropdown */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    {type === 'expense' ? 'Vendor' : 'Source'} <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Popover open={showVendors} onOpenChange={(open) => {
                    setShowVendors(open);
                    if (!open) setVendorSearch("");
                  }}>
                    <PopoverTrigger asChild>
                      <button className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center justify-between min-h-[48px]">
                        {vendor ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-md flex items-center justify-center"
                              style={{ 
                                backgroundColor: selectedVendorDetails?.color 
                                  ? `${selectedVendorDetails.color}20` 
                                  : 'hsl(var(--success) / 0.2)' 
                              }}
                            >
                              {renderVendorIcon(
                                selectedVendorDetails?.icon, 
                                selectedVendorDetails?.color || 'hsl(var(--success))',
                                14
                              )}
                            </div>
                            <span className="text-sm font-medium">{vendor}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {type === 'expense' ? 'Select vendor...' : 'Select source...'}
                          </span>
                        )}
                        <ChevronDown size={16} className="text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-72 p-2 bg-card z-[90]" align="start" sideOffset={8} onOpenAutoFocus={(e) => e.preventDefault()}>
                      <div className="relative mb-2">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={vendorSearch}
                          onChange={(e) => setVendorSearch(e.target.value)}
                          placeholder="Search vendors..."
                          className="pl-8 h-8 text-base"
                        />
                      </div>
                      <div className="max-h-[40vh] overflow-y-auto overscroll-contain touch-pan-y">
                        <div className="space-y-1">
                          {allVendors.length > 0 ? (
                            <>
                              {allVendors
                                .filter(v => !vendorSearch || v.name.toLowerCase().includes(vendorSearch.toLowerCase()))
                                .map((v) => (
                                  <button
                                    key={v.name}
                                    onClick={() => {
                                      setVendor(v.name);
                                      setVendorSearch("");
                                      setShowVendors(false);
                                    }}
                                    className={cn(
                                      "w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors flex items-center gap-3",
                                      vendor === v.name ? "bg-primary/10" : "hover:bg-muted"
                                    )}
                                  >
                                    <div 
                                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                      style={{ 
                                        backgroundColor: v.color ? `${v.color}20` : 'hsl(var(--success) / 0.2)' 
                                      }}
                                    >
                                      {renderVendorIcon(v.icon, v.color || 'hsl(var(--success))', 14)}
                                    </div>
                                    <span className="font-medium flex-1">{v.name}</span>
                                    <Check size={14} className={cn("text-primary shrink-0", vendor === v.name ? "opacity-100" : "opacity-0")} />
                                  </button>
                                ))}
                              <button
                                onClick={() => {
                                  setShowVendors(false);
                                  onClose();
                                  navigate(appPath('/?tab=settings'));
                                }}
                                className="w-full px-3 py-2 text-xs text-primary hover:text-primary/80 text-center border-t border-border mt-2 pt-2 flex items-center justify-center gap-1 transition-colors"
                              >
                                <Settings size={12} />
                                To add more vendors, go to Settings
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setShowVendors(false);
                                onClose();
                                navigate(appPath('/?tab=settings'));
                              }}
                              className="w-full px-3 py-4 text-center text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              No vendors added yet.<br />
                              <span className="text-xs text-primary flex items-center justify-center gap-1 mt-1">
                                <Settings size={12} />
                                Add vendors in Settings
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Payment Method */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Payment Method</Label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setPaymentMethod('online')}
                      className={cn(
                        "flex-1 p-3 rounded-xl flex items-center justify-center gap-2 border-2 transition-colors",
                        paymentMethod === 'online' 
                          ? "border-primary bg-primary/5" 
                          : "border-transparent bg-muted"
                      )}
                    >
                      <CreditCard size={16} className={paymentMethod === 'online' ? "text-primary" : "text-muted-foreground"} />
                      <span className={cn("text-sm font-medium", paymentMethod === 'online' ? "text-foreground" : "text-muted-foreground")}>Online</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={cn(
                        "flex-1 p-3 rounded-xl flex items-center justify-center gap-2 border-2 transition-colors",
                        paymentMethod === 'cash' 
                          ? "border-primary bg-primary/5" 
                          : "border-transparent bg-muted"
                      )}
                    >
                      <Banknote size={16} className={paymentMethod === 'cash' ? "text-primary" : "text-muted-foreground"} />
                      <span className={cn("text-sm font-medium", paymentMethod === 'cash' ? "text-foreground" : "text-muted-foreground")}>Cash</span>
                    </button>
                  </div>
                </div>
                
                {/* Project Dropdown */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Project <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Popover open={showProjects} onOpenChange={(open) => {
                    setShowProjects(open);
                    if (!open) setProjectSearch("");
                  }}>
                    <PopoverTrigger asChild>
                      <button className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center justify-between min-h-[48px]">
                        {selectedProject ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: selectedProject.color }}
                            />
                            <span className="text-sm font-medium">{selectedProject.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Select project...</span>
                        )}
                        <ChevronDown size={16} className="text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-72 p-2 bg-card z-[90]" align="start" sideOffset={8} onOpenAutoFocus={(e) => e.preventDefault()}>
                      <div className="relative mb-2">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          placeholder="Search projects..."
                          className="pl-8 h-8 text-base"
                        />
                      </div>
                      <div className="max-h-[40vh] overflow-y-auto overscroll-contain touch-pan-y">
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              setProjectId("");
                              setShowProjects(false);
                            }}
                            className={cn(
                              "w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors",
                              !projectId ? "bg-primary/10" : "hover:bg-muted"
                            )}
                          >
                            No Project
                          </button>
                          {projects.filter(p => !p.archived).filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase())).length > 0 ? (
                            <>
                              {projects.filter(p => !p.archived).filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase())).map((proj) => (
                                <button
                                  key={proj.id}
                                  onClick={() => {
                                    setProjectId(proj.id);
                                    setShowProjects(false);
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors flex items-center gap-2",
                                    projectId === proj.id ? "bg-primary/10" : "hover:bg-muted"
                                  )}
                                >
                                  <div 
                                    className="w-3 h-3 rounded-full shrink-0" 
                                    style={{ backgroundColor: proj.color }}
                                  />
                                  <span className="font-medium flex-1">{proj.name}</span>
                                  <Check size={14} className={cn("text-primary shrink-0", projectId === proj.id ? "opacity-100" : "opacity-0")} />
                                </button>
                              ))}
                              <button
                                onClick={() => {
                                  setShowProjects(false);
                                  onClose();
                                  navigate(appPath('/?tab=settings'));
                                }}
                                className="w-full px-3 py-2 text-xs text-primary hover:text-primary/80 text-center border-t border-border mt-2 pt-2 flex items-center justify-center gap-1 transition-colors"
                              >
                                <Settings size={12} />
                                To add more projects, go to Settings
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setShowProjects(false);
                                onClose();
                                navigate(appPath('/?tab=settings'));
                              }}
                              className="w-full px-3 py-4 text-center text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              No projects added yet.<br />
                              <span className="text-xs text-primary flex items-center justify-center gap-1 mt-1">
                                <Settings size={12} />
                                Add projects in Settings
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Partner Dropdown - Always show if partners exist */}
                {partners && partners.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Handled By <span className="text-muted-foreground/60">(optional)</span>
                    </Label>
                    <Popover open={showPartners} onOpenChange={setShowPartners}>
                      <PopoverTrigger asChild>
                        <button className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center justify-between min-h-[48px]">
                          {selectedPartner ? (
                            <div className="flex items-center gap-2">
                              {selectedPartner.avatarUrl ? (
                                <img src={selectedPartner.avatarUrl} alt={selectedPartner.name} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div 
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: selectedPartner.color }}
                                >
                                  {selectedPartner.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm font-medium">{selectedPartner.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Select partner...</span>
                            </div>
                          )}
                          <ChevronDown size={16} className="text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2 bg-card z-[90]" align="start">
                        <div className="max-h-64 overflow-y-auto overscroll-contain touch-pan-y">
                          <div className="space-y-1">
                            <button
                              onClick={() => {
                                setPartnerId("");
                                setShowPartners(false);
                              }}
                              className={cn(
                                "w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors",
                                !partnerId ? "bg-primary/10" : "hover:bg-muted"
                              )}
                            >
                              None
                            </button>
                            {partners.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setPartnerId(p.id);
                                  setShowPartners(false);
                                }}
                                className={cn(
                                  "w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors flex items-center gap-2",
                                  partnerId === p.id ? "bg-primary/10" : "hover:bg-muted"
                                )}
                              >
                                {p.avatarUrl ? (
                                  <img src={p.avatarUrl} alt={p.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div 
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                    style={{ backgroundColor: p.color }}
                                  >
                                    {p.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="font-medium flex-1">{p.name}</span>
                                <Check size={14} className={cn("text-primary shrink-0", partnerId === p.id ? "opacity-100" : "opacity-0")} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                
                {/* Notes */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Notes <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add description..."
                    className="mt-1"
                  />
                </div>
                
                {/* Receipt Upload */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                    Receipt/Invoice <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <ReceiptUpload
                    value={receiptUrl}
                    onChange={setReceiptUrl}
                    userId={userId}
                    transactionId={transaction.id}
                  />
                </div>
                
                {/* GST Toggle */}
                <GstToggle value={isGst} onChange={setIsGst} />
              </div>
            </div>
            
            {/* Sticky Save Button */}
            <div className="p-4 border-t border-border bg-card shrink-0">
              <Button
                onClick={handleSubmit}
                disabled={!amount || !categoryId}
                className="w-full py-5 text-base font-semibold gradient-primary text-primary-foreground rounded-xl"
              >
                Save Changes →
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

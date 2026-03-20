import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ChevronDown, CreditCard, Banknote, CalendarIcon, Check, Settings, Repeat, Users, SplitSquareHorizontal, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinanceStore } from "@/lib/store";
import { TransactionType, PaymentMethod, PlannedInstallment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { renderCategoryIcon, renderVendorIcon } from "@/lib/iconUtils";
import { appPath } from "@/lib/domainUtils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useDuplicateDetection } from "@/hooks/useDuplicateDetection";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/constants";
import { toast } from "sonner";
import { ReceiptUpload } from "./ReceiptUpload";
import { GstToggle } from "./GstToggle";
import { InstallmentRow } from "./InstallmentRow";
import { v4 as uuidv4 } from "uuid";

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  userId?: string;
  isEmployee?: boolean;
  onNavigate?: (section: string) => void;
}

export const AddTransactionSheet = ({ isOpen, onClose, defaultType = 'expense', userId, isEmployee = false, onNavigate }: AddTransactionSheetProps) => {
  const navigate = useNavigate();
  const { categories, projects, transactions, vendors, partners, addTransaction } = useFinanceStore();
  const { checkForDuplicates } = useDuplicateDetection();
  
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("Not Specified");
  const [categoryId, setCategoryId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [handledBy, setHandledBy] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [magicInput, setMagicInput] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showVendors, setShowVendors] = useState(false);
  const [showPartners, setShowPartners] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>("monthly");
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicates, setDuplicates] = useState<ReturnType<typeof checkForDuplicates>>([]);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>();
  const [isGst, setIsGst] = useState(false);
  const [isPartPayment, setIsPartPayment] = useState(false);
  const [totalExpectedAmount, setTotalExpectedAmount] = useState("");
  const [plannedInstallments, setPlannedInstallments] = useState<PlannedInstallment[]>([]);
  
  const filteredCategories = categories.filter(c => c.type === type);
  const selectedCategory = categories.find(c => c.id === categoryId);

  // Pre-select "Not Specified" category when form opens or type changes
  useEffect(() => {
    if (!categoryId) {
      const notSpecifiedCat = filteredCategories.find(c => c.name === 'Not Specified');
      if (notSpecifiedCat) setCategoryId(notSpecifiedCat.id);
    }
  }, [type, filteredCategories]);
  const availableProjects = useMemo(() => {
    if (isEmployee) return projects.filter(p => !p.archived && (p.assignedEmployeeIds || []).includes(userId || ''));
    return projects.filter(p => !p.archived);
  }, [projects, isEmployee, userId]);
  const selectedProject = projects.find(p => p.id === projectId);
  const selectedPartner = partners.find(p => p.userId === handledBy);
  
  // Get all vendors from both store and transactions
  const allVendors = useMemo(() => {
    const storedVendors = vendors;
    const transactionVendorNames = Array.from(new Set(transactions.map(t => t.vendor)));
    
    // Merge: stored vendors take priority, then transaction vendors as fallback
    const vendorMap = new Map<string, { name: string; icon?: string; color?: string }>();
    
    // Add transaction vendors first (will be overwritten by stored vendors)
    transactionVendorNames.forEach(name => {
      vendorMap.set(name.toLowerCase(), { name });
    });
    
    // Add stored vendors (overwrite transaction vendors)
    storedVendors.forEach(v => {
      vendorMap.set(v.name.toLowerCase(), { name: v.name, icon: v.icon, color: v.color });
    });
    
    return Array.from(vendorMap.values());
  }, [vendors, transactions]);
  
  // Find vendor details for selected vendor
  const selectedVendorDetails = useMemo(() => {
    return allVendors.find(v => v.name.toLowerCase() === vendor.toLowerCase());
  }, [allVendors, vendor]);
  
  const handleMagicFill = () => {
    const text = magicInput.toLowerCase();
    const numberMatch = text.match(/\d+/);
    
    if (numberMatch) {
      setAmount(numberMatch[0]);
    }
    
    const words = text.split(' ');
    const atIndex = words.indexOf('at');
    if (atIndex !== -1 && words[atIndex + 1]) {
      setVendor(words.slice(atIndex + 1).join(' ').replace(/for.*/, '').trim());
    } else if (words.length > 1) {
      setVendor(words[0].charAt(0).toUpperCase() + words[0].slice(1));
    }
    
    if (text.includes('coffee') || text.includes('lunch') || text.includes('food') || text.includes('starbucks')) {
      setCategoryId('food');
    } else if (text.includes('uber') || text.includes('taxi') || text.includes('transport')) {
      setCategoryId('transport');
    } else if (text.includes('shopping') || text.includes('buy')) {
      setCategoryId('shopping');
    }
    
    setMagicInput("");
  };
  
  const doAddTransaction = useCallback(async () => {
    await addTransaction({
      type,
      amount: parseFloat(amount),
      title: title || undefined,
      vendor: vendor || 'Not Specified',
      categoryId,
      projectId: projectId || undefined,
      handledBy: handledBy || undefined,
      paymentMethod,
      date: format(date, 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      notes: notes || undefined,
      isRecurring: isRecurring || undefined,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      receiptUrl: receiptUrl || undefined,
      isGst: isGst || undefined,
      isPartPayment: isPartPayment || undefined,
      totalExpectedAmount: isPartPayment && totalExpectedAmount ? parseFloat(totalExpectedAmount) : undefined,
      plannedInstallments: isPartPayment && plannedInstallments.length > 0 ? plannedInstallments : undefined,
    }, userId);
    
    // Show success confirmation
    toast.success(type === 'expense' ? 'Expense Added' : 'Income Added', {
      description: `₹${parseFloat(amount).toLocaleString()} ${title ? `- ${title}` : ''}${isPartPayment ? ' (Part Payment)' : ''}`,
      duration: 3000,
    });
    
    setAmount("");
    setTitle("");
    setVendor("Not Specified");
    setCategoryId("");
    setProjectId("");
    setHandledBy("");
    setNotes("");
    setVendorSearch("");
    setIsRecurring(false);
    setRecurringFrequency("monthly");
    setShowDuplicateWarning(false);
    setDuplicates([]);
    setReceiptUrl(undefined);
    setIsGst(false);
    setIsPartPayment(false);
    setTotalExpectedAmount("");
    setPlannedInstallments([]);
    onClose();
  }, [type, amount, title, vendor, categoryId, projectId, handledBy, paymentMethod, date, notes, isRecurring, recurringFrequency, receiptUrl, isGst, isPartPayment, totalExpectedAmount, plannedInstallments, userId, addTransaction, onClose]);
  
  // Installment helper functions
  const addNewInstallment = useCallback(() => {
    const total = parseFloat(totalExpectedAmount || '0');
    const current = parseFloat(amount || '0');
    const planned = plannedInstallments.reduce((sum, i) => sum + i.amount, 0);
    const remaining = Math.max(0, total - current - planned);
    
    setPlannedInstallments(prev => [
      ...prev,
      {
        id: uuidv4(),
        amount: remaining > 0 ? remaining : 0,
        expectedDate: undefined,
        status: 'pending' as const,
      }
    ]);
  }, [totalExpectedAmount, amount, plannedInstallments]);
  
  const updateInstallment = useCallback((id: string, updates: Partial<PlannedInstallment>) => {
    setPlannedInstallments(prev => 
      prev.map(inst => inst.id === id ? { ...inst, ...updates } : inst)
    );
  }, []);
  
  const removeInstallment = useCallback((id: string) => {
    setPlannedInstallments(prev => prev.filter(inst => inst.id !== id));
  }, []);
  
  const getRemainingAmount = useCallback(() => {
    const total = parseFloat(totalExpectedAmount || '0');
    const current = parseFloat(amount || '0');
    const planned = plannedInstallments.reduce((sum, i) => sum + i.amount, 0);
    return Math.max(0, total - current - planned);
  }, [totalExpectedAmount, amount, plannedInstallments]);
  
  const handleSubmit = () => {
    if (!amount || !categoryId) return;
    
    // Check for duplicates
    const potentialDuplicates = checkForDuplicates(
      vendor || 'Not Specified',
      parseFloat(amount),
      format(date, 'yyyy-MM-dd')
    );
    
    if (potentialDuplicates.length > 0) {
      setDuplicates(potentialDuplicates);
      setShowDuplicateWarning(true);
      return;
    }
    
    doAddTransaction();
  };
  
  const handleDismissDuplicate = () => {
    setShowDuplicateWarning(false);
    setDuplicates([]);
  };
  
  const handleProceedAnyway = () => {
    setShowDuplicateWarning(false);
    doAddTransaction();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[85vh] overflow-hidden"
          >
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-muted rounded-full" />
            </div>
            
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold">
                Add {type === 'expense' ? 'Expense' : 'Income'}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            
            <ScrollArea className="h-[calc(85vh-100px)]">
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
                
                {/* Magic Fill */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Sparkles size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <Input
                      placeholder="Magic: 'Lunch at Cafe for 450'"
                      value={magicInput}
                      onChange={(e) => setMagicInput(e.target.value)}
                      className="pl-9 text-sm bg-primary/5 border-primary/20"
                    />
                  </div>
                  <Button 
                    onClick={handleMagicFill}
                    disabled={!magicInput}
                    size="sm"
                    variant="outline"
                  >
                    Fill
                  </Button>
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
                    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-72 p-2 bg-card z-[70]" align="start" sideOffset={8} onOpenAutoFocus={(e) => e.preventDefault()}>
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
                              {filteredCategories
                                .filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                .sort((a, b) => (a.name === 'Not Specified' ? -1 : b.name === 'Not Specified' ? 1 : 0))
                                .map((cat) => (
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
                                   onNavigate?.('categories');
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
                                 onNavigate?.('categories');
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
                    <PopoverContent className="w-auto p-0 bg-card z-[70]" align="start">
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
                
                {/* Recurring Toggle */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Recurring <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <button
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={cn(
                      "w-full mt-1 p-3 rounded-xl flex items-center justify-between min-h-[48px] border-2 transition-colors",
                      isRecurring 
                        ? "border-primary bg-primary/5" 
                        : "border-transparent bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Repeat size={16} className={isRecurring ? "text-primary" : "text-muted-foreground"} />
                      <span className={cn("text-sm font-medium", isRecurring ? "text-foreground" : "text-muted-foreground")}>
                        {isRecurring ? "This is a recurring transaction" : "Make this recurring"}
                      </span>
                    </div>
                    <div className={cn(
                      "w-10 h-6 rounded-full transition-colors flex items-center px-0.5",
                      isRecurring ? "bg-primary" : "bg-muted-foreground/30"
                    )}>
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white shadow transition-transform",
                        isRecurring ? "translate-x-4" : "translate-x-0"
                      )} />
                    </div>
                  </button>
                  
                  {/* Frequency Options */}
                  {isRecurring && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 grid grid-cols-4 gap-2"
                    >
                      {([
                        { value: "daily" as const, label: "Daily" },
                        { value: "weekly" as const, label: "Weekly" },
                        { value: "monthly" as const, label: "Monthly" },
                        { value: "yearly" as const, label: "Yearly" },
                      ]).map((freq) => (
                        <button
                          key={freq.value}
                          onClick={() => setRecurringFrequency(freq.value)}
                          className={cn(
                            "p-2 rounded-lg text-xs font-medium transition-colors border-2",
                            recurringFrequency === freq.value
                              ? "border-primary bg-accent text-accent-foreground"
                              : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                          )}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
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
                    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-72 p-2 bg-card z-[70]" align="start" sideOffset={8} onOpenAutoFocus={(e) => e.preventDefault()}>
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
                                .sort((a, b) => (a.name === 'Not Specified' ? -1 : b.name === 'Not Specified' ? 1 : 0))
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
                                    <span className="flex-1">{v.name}</span>
                                    <Check size={14} className={cn("text-primary shrink-0", vendor === v.name ? "opacity-100" : "opacity-0")} />
                                  </button>
                                ))}
                              <button
                                onClick={() => {
                                  setShowVendors(false);
                                  onClose();
                                   onNavigate?.('vendors');
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
                                 onNavigate?.('vendors');
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
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={cn(
                        "p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors",
                        paymentMethod === "cash" 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      )}
                    >
                      <Banknote size={16} />
                      <span className="text-sm font-medium">Cash</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("online")}
                      className={cn(
                        "p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors",
                        paymentMethod === "online" 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      )}
                    >
                      <CreditCard size={16} />
                      <span className="text-sm font-medium">Online</span>
                    </button>
                  </div>
                </div>
                
                {/* Partner Selector - Always show, even if no partners yet */}
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
                            <span className="text-sm text-muted-foreground">Select partner...</span>
                          )}
                          <ChevronDown size={16} className="text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2 bg-card z-[70]" align="start">
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              setHandledBy("");
                              setShowPartners(false);
                            }}
                            className={cn(
                              "w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors flex items-center gap-3",
                              !handledBy ? "bg-primary/10" : "hover:bg-muted"
                            )}
                          >
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <Users size={12} className="text-muted-foreground" />
                            </div>
                            <span className="flex-1 text-muted-foreground">None</span>
                            <Check size={14} className={cn("text-primary shrink-0", !handledBy ? "opacity-100" : "opacity-0")} />
                          </button>
                          {partners.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setHandledBy(p.userId || p.id);
                                setShowPartners(false);
                              }}
                              className={cn(
                                "w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors flex items-center gap-3",
                                handledBy === (p.userId || p.id) ? "bg-primary/10" : "hover:bg-muted"
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
                              <span className="flex-1">{p.name}</span>
                              <Check size={14} className={cn("text-primary shrink-0", handledBy === (p.userId || p.id) ? "opacity-100" : "opacity-0")} />
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                
                {/* Project Label */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Project Label <span className="text-muted-foreground/60">(optional)</span>
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
                              className="w-6 h-6 rounded-md flex items-center justify-center"
                              style={{ backgroundColor: `${selectedProject.color}20` }}
                            >
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: selectedProject.color }}
                              />
                            </div>
                            <span className="text-sm font-medium">{selectedProject.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Select project...</span>
                        )}
                        <ChevronDown size={16} className="text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-72 p-2 bg-card z-[70]" align="start" sideOffset={8} onOpenAutoFocus={(e) => e.preventDefault()}>
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
                              "w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors flex items-center gap-3",
                              !projectId ? "bg-primary/10" : "hover:bg-muted"
                            )}
                          >
                            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                            </div>
                            <span className="flex-1 text-muted-foreground">None</span>
                            <Check size={14} className={cn("text-primary shrink-0", !projectId ? "opacity-100" : "opacity-0")} />
                          </button>
                          {availableProjects.filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase())).length > 0 ? (
                            <>
                              {availableProjects.filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase())).map((proj) => (
                                <button
                                  key={proj.id}
                                  onClick={() => {
                                    setProjectId(proj.id);
                                    setShowProjects(false);
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors flex items-center gap-3",
                                    projectId === proj.id ? "bg-primary/10" : "hover:bg-muted"
                                  )}
                                >
                                  <div 
                                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${proj.color}20` }}
                                  >
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: proj.color }}
                                    />
                                  </div>
                                  <span className="flex-1">{proj.name}</span>
                                  <Check size={14} className={cn("text-primary shrink-0", projectId === proj.id ? "opacity-100" : "opacity-0")} />
                                </button>
                              ))}
                              <button
                                onClick={() => {
                                  setShowProjects(false);
                                  onClose();
                                   onNavigate?.('labels');
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
                                 onNavigate?.('labels');
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
                  />
                </div>
                
                {/* GST Toggle */}
                <GstToggle value={isGst} onChange={setIsGst} />
                
                {/* Part Payment Toggle */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Part Payment <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <button
                    onClick={() => {
                      setIsPartPayment(!isPartPayment);
                      if (!isPartPayment) {
                        setPlannedInstallments([]);
                      }
                    }}
                    className={cn(
                      "w-full mt-1 p-3 rounded-xl flex items-center justify-between min-h-[48px] border-2 transition-colors",
                      isPartPayment 
                        ? "border-amber-500 bg-amber-500/5" 
                        : "border-transparent bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <SplitSquareHorizontal size={16} className={isPartPayment ? "text-amber-500" : "text-muted-foreground"} />
                      <span className={cn("text-sm font-medium", isPartPayment ? "text-foreground" : "text-muted-foreground")}>
                        {isPartPayment ? "This is a part payment" : "Mark as part payment"}
                      </span>
                    </div>
                    <div className={cn(
                      "w-10 h-6 rounded-full transition-colors flex items-center px-0.5",
                      isPartPayment ? "bg-amber-500" : "bg-muted-foreground/30"
                    )}>
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white shadow transition-transform",
                        isPartPayment ? "translate-x-4" : "translate-x-0"
                      )} />
                    </div>
                  </button>
                  
                  {/* Inline Installment Manager */}
                  <AnimatePresence>
                    {isPartPayment && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-4"
                      >
                        {/* Total Expected Amount */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Total Expected Amount</Label>
                          <div className="flex items-center gap-2 border-b-2 border-amber-500/50 pb-2 mt-1">
                            <span className="text-lg font-bold text-muted-foreground">{CURRENCY_SYMBOL}</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              value={totalExpectedAmount}
                              onChange={(e) => setTotalExpectedAmount(e.target.value)}
                              placeholder="0"
                              className="flex-1 text-xl font-bold bg-transparent outline-none"
                            />
                          </div>
                        </div>

                        {/* Installments List */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                              Installments
                            </Label>
                            <span className="text-xs text-amber-500">
                              {plannedInstallments.length + 1} installment(s)
                            </span>
                          </div>

                          {/* Current Payment (First Installment) */}
                          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                  <Check size={12} className="text-white" />
                                </div>
                                <span className="text-sm font-medium">This Payment</span>
                              </div>
                              <span className="font-bold text-amber-600">
                                {CURRENCY_SYMBOL}{parseFloat(amount || '0').toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-7">
                              {format(date, 'MMM dd, yyyy')} • Will be recorded now
                            </p>
                          </div>

                          {/* Planned Future Installments */}
                          {plannedInstallments.map((inst, idx) => (
                            <InstallmentRow
                              key={inst.id}
                              installment={inst}
                              index={idx + 2}
                              onUpdate={(updates) => updateInstallment(inst.id, updates)}
                              onRemove={() => removeInstallment(inst.id)}
                            />
                          ))}

                          {/* Add Installment Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addNewInstallment}
                            className="w-full border-dashed border-amber-500/30 text-amber-600 hover:bg-amber-500/5"
                          >
                            <Plus size={14} className="mr-1" />
                            Add Another Installment
                          </Button>
                        </div>

                        {/* Summary */}
                        <div className="p-3 bg-muted rounded-xl space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Expected:</span>
                            <span className="font-medium">
                              {CURRENCY_SYMBOL}{parseFloat(totalExpectedAmount || '0').toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Planned:</span>
                            <span className="font-medium">
                              {CURRENCY_SYMBOL}{(parseFloat(amount || '0') + plannedInstallments.reduce((sum, i) => sum + i.amount, 0)).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className={cn(
                              "font-semibold",
                              getRemainingAmount() > 0 ? "text-amber-500" : "text-success"
                            )}>
                              {CURRENCY_SYMBOL}{getRemainingAmount().toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!amount || !categoryId}
                  className="w-full py-5 text-base font-semibold gradient-primary text-primary-foreground rounded-xl"
                >
                  Add {type === 'expense' ? 'Expense' : 'Income'} →
                </Button>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}

      {/* Duplicate Warning Modal */}
      <AlertDialog open={showDuplicateWarning} onOpenChange={(open) => !open && handleDismissDuplicate()}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="text-warning" size={24} />
            </div>
            <AlertDialogTitle className="text-center">Potential Duplicate Detected</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This looks similar to existing transactions:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {duplicates.map((dup) => (
              <div key={dup.transaction.id} className="bg-muted rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">
                    {dup.transaction.title || dup.transaction.vendor}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {dup.similarity}% match
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(dup.transaction.amount)} • {formatDate(dup.transaction.date)}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dup.reasons.map((reason, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-warning/10 text-warning text-[10px] rounded">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
            <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleProceedAnyway} className="flex-1">
              Add Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  );
};

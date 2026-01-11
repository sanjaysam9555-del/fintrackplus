import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ChevronDown, CreditCard, Banknote, CalendarIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinanceStore } from "@/lib/store";
import { TransactionType, PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { CategoryIcon } from "./CategoryIcon";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export const AddTransactionSheet = ({ isOpen, onClose, defaultType = 'expense' }: AddTransactionSheetProps) => {
  const { categories, projects, transactions, addTransaction } = useFinanceStore();
  
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [magicInput, setMagicInput] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  
  const filteredCategories = categories.filter(c => c.type === type);
  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedProject = projects.find(p => p.id === projectId);
  
  // Get unique vendors from past transactions
  const uniqueVendors = useMemo(() => {
    const vendors = new Set(transactions.map(t => t.vendor));
    return Array.from(vendors).filter(v => 
      v.toLowerCase().includes(vendorSearch.toLowerCase())
    ).slice(0, 5);
  }, [transactions, vendorSearch]);
  
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
  
  const handleSubmit = () => {
    if (!amount || !vendor || !categoryId) return;
    
    addTransaction({
      type,
      amount: parseFloat(amount),
      vendor,
      categoryId,
      projectId: projectId || undefined,
      paymentMethod,
      date: format(date, 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      notes: notes || undefined,
    });
    
    setAmount("");
    setVendor("");
    setCategoryId("");
    setProjectId("");
    setNotes("");
    onClose();
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
                
                {/* Amount */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Amount *</Label>
                  <div className="flex items-center gap-2 mt-1 border-b-2 border-primary pb-2">
                    <span className="text-xl font-bold text-muted-foreground">{CURRENCY_SYMBOL}</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="flex-1 text-2xl font-bold bg-transparent outline-none"
                    />
                  </div>
                </div>
                
                {/* Category & Date Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Category Dropdown */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Category *</Label>
                    <Popover open={showCategories} onOpenChange={setShowCategories}>
                      <PopoverTrigger asChild>
                        <button className="w-full mt-1 p-2.5 bg-muted rounded-xl flex items-center justify-between">
                          {selectedCategory ? (
                            <div className="flex items-center gap-2">
                              <CategoryIcon 
                                iconName={selectedCategory.icon} 
                                colorClass={selectedCategory.color} 
                                size="sm"
                              />
                              <span className="text-sm font-medium truncate">{selectedCategory.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Select</span>
                          )}
                          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2 bg-card z-[70]" align="start">
                        <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                          {filteredCategories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setCategoryId(cat.id);
                                setShowCategories(false);
                              }}
                              className={cn(
                                "p-2 rounded-lg flex flex-col items-center gap-1 transition-colors",
                                categoryId === cat.id ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"
                              )}
                            >
                              <CategoryIcon iconName={cat.icon} colorClass={cat.color} size="sm" />
                              <span className="text-[10px] text-center leading-tight truncate w-full">{cat.name}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Date Picker */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full mt-1 p-2.5 bg-muted rounded-xl flex items-center justify-between">
                          <span className="text-sm font-medium">{format(date, 'MMM dd')}</span>
                          <CalendarIcon size={14} className="text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card z-[70]" align="end">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => d && setDate(d)}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* Vendor with Dropdown */}
                <div className="relative">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    {type === 'expense' ? 'Vendor' : 'Source'} *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      value={vendor}
                      onChange={(e) => {
                        setVendor(e.target.value);
                        setVendorSearch(e.target.value);
                        setShowVendorDropdown(true);
                      }}
                      onFocus={() => setShowVendorDropdown(true)}
                      onBlur={() => setTimeout(() => setShowVendorDropdown(false), 150)}
                      placeholder={type === 'expense' ? "e.g. Starbucks, Amazon" : "e.g. Salary, Freelance"}
                      className="pr-8"
                    />
                    {vendor && (
                      <button 
                        onClick={() => setVendor("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  
                  {/* Vendor Suggestions */}
                  <AnimatePresence>
                    {showVendorDropdown && uniqueVendors.length > 0 && vendorSearch && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                      >
                        {uniqueVendors.map((v) => (
                          <button
                            key={v}
                            onMouseDown={() => {
                              setVendor(v);
                              setShowVendorDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                          >
                            <Check size={12} className={cn("text-primary", vendor === v ? "opacity-100" : "opacity-0")} />
                            {v}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Payment Method */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={cn(
                        "p-2.5 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors",
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
                        "p-2.5 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors",
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
                
                {/* Project Label */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Project Label <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Popover open={showProjects} onOpenChange={setShowProjects}>
                    <PopoverTrigger asChild>
                      <button className="w-full mt-1 p-2.5 bg-muted rounded-xl flex items-center justify-between">
                        {selectedProject ? (
                          <span className="text-sm font-medium">{selectedProject.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Select project...</span>
                        )}
                        <ChevronDown size={14} className="text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1 bg-card z-[70]" align="start">
                      <button
                        onClick={() => {
                          setProjectId("");
                          setShowProjects(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-muted text-muted-foreground"
                      >
                        None
                      </button>
                      {projects.map((proj) => (
                        <button
                          key={proj.id}
                          onClick={() => {
                            setProjectId(proj.id);
                            setShowProjects(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm rounded-md transition-colors flex items-center gap-2",
                            projectId === proj.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                          )}
                        >
                          <Check size={12} className={cn("text-primary", projectId === proj.id ? "opacity-100" : "opacity-0")} />
                          {proj.name}
                        </button>
                      ))}
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
                
                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!amount || !vendor || !categoryId}
                  className="w-full py-5 text-base font-semibold gradient-primary text-primary-foreground rounded-xl"
                >
                  Add {type === 'expense' ? 'Expense' : 'Income'} →
                </Button>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

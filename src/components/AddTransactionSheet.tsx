import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Sparkles, ChevronDown, CreditCard, Banknote, CalendarIcon } from "lucide-react";
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

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export const AddTransactionSheet = ({ isOpen, onClose, defaultType = 'expense' }: AddTransactionSheetProps) => {
  const { categories, projects, addTransaction } = useFinanceStore();
  
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
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
  
  const handleMagicFill = () => {
    // Simple AI-like parsing for demo
    const text = magicInput.toLowerCase();
    const numberMatch = text.match(/\d+/);
    
    if (numberMatch) {
      setAmount(numberMatch[0]);
    }
    
    // Extract vendor
    const words = text.split(' ');
    const atIndex = words.indexOf('at');
    if (atIndex !== -1 && words[atIndex + 1]) {
      setVendor(words.slice(atIndex + 1).join(' ').replace(/for.*/, '').trim());
    } else if (words.length > 1) {
      setVendor(words[0].charAt(0).toUpperCase() + words[0].slice(1));
    }
    
    // Try to detect category
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
    
    // Reset form
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-muted rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold">
                Add {type === 'expense' ? 'Expense' : 'Income'}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-6 pb-8">
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
              <div className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Sparkles size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <Input
                      placeholder="Magic fill: 'Lunch at Starbucks for 450'"
                      value={magicInput}
                      onChange={(e) => setMagicInput(e.target.value)}
                      className="pl-10 bg-primary-light border-primary/20"
                    />
                  </div>
                  <Button 
                    onClick={handleMagicFill}
                    disabled={!magicInput}
                    variant="outline"
                    className="shrink-0"
                  >
                    Fill
                  </Button>
                </div>
              </div>
              
              {/* Receipt Scanner Placeholder */}
              <button className="w-full p-4 border-2 border-dashed border-border rounded-xl flex items-center gap-3 hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                  <Camera className="text-primary" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium">Scan Receipt</p>
                  <p className="text-sm text-muted-foreground">Auto-fill from photo</p>
                </div>
              </button>
              
              {/* Amount */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Amount</Label>
                <div className="flex items-center gap-2 mt-1 border-b-2 border-primary pb-2">
                  <span className="text-2xl font-bold text-muted-foreground">{CURRENCY_SYMBOL}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="flex-1 text-3xl font-bold bg-transparent outline-none"
                  />
                </div>
              </div>
              
              {/* Category & Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Category</Label>
                  <button
                    onClick={() => setShowCategories(!showCategories)}
                    className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center justify-between"
                  >
                    {selectedCategory ? (
                      <div className="flex items-center gap-2">
                        <CategoryIcon 
                          iconName={selectedCategory.icon} 
                          colorClass={selectedCategory.color} 
                          size="sm"
                        />
                        <span className="font-medium">{selectedCategory.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select</span>
                    )}
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </button>
                  
                  <AnimatePresence>
                    {showCategories && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-2 bg-muted rounded-xl grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                          {filteredCategories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setCategoryId(cat.id);
                                setShowCategories(false);
                              }}
                              className={cn(
                                "p-2 rounded-lg flex flex-col items-center gap-1 transition-colors",
                                categoryId === cat.id ? "bg-primary/10" : "hover:bg-card"
                              )}
                            >
                              <CategoryIcon iconName={cat.icon} colorClass={cat.color} size="sm" />
                              <span className="text-[10px] text-center leading-tight">{cat.name}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center justify-between">
                        <span className="font-medium">{format(date, 'MMM dd, yyyy')}</span>
                        <CalendarIcon size={16} className="text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card z-[60]" align="start">
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
              
              {/* Payment Method */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Payment Method <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={cn(
                      "p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors",
                      paymentMethod === "cash" 
                        ? "border-primary bg-primary-light" 
                        : "border-border"
                    )}
                  >
                    <Banknote size={18} />
                    <span className="font-medium">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("online")}
                    className={cn(
                      "p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors",
                      paymentMethod === "online" 
                        ? "border-primary bg-primary-light" 
                        : "border-border"
                    )}
                  >
                    <CreditCard size={18} />
                    <span className="font-medium">Online</span>
                  </button>
                </div>
              </div>
              
              {/* Vendor */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Vendor <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. Steel Supply Co."
                  className="mt-1"
                />
              </div>
              
              {/* Project Label */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Project Label
                  </Label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <button
                  onClick={() => setShowProjects(!showProjects)}
                  className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center justify-between"
                >
                  {selectedProject ? (
                    <span className="font-medium">{selectedProject.name}</span>
                  ) : (
                    <span className="text-muted-foreground">Select or search label...</span>
                  )}
                  <ChevronDown size={16} className="text-muted-foreground" />
                </button>
                
                <AnimatePresence>
                  {showProjects && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-2 bg-muted rounded-xl space-y-1">
                        <button
                          onClick={() => {
                            setProjectId("");
                            setShowProjects(false);
                          }}
                          className="w-full p-2 rounded-lg text-left hover:bg-card"
                        >
                          <span className="text-muted-foreground">None</span>
                        </button>
                        {projects.map((proj) => (
                          <button
                            key={proj.id}
                            onClick={() => {
                              setProjectId(proj.id);
                              setShowProjects(false);
                            }}
                            className={cn(
                              "w-full p-2 rounded-lg text-left transition-colors",
                              projectId === proj.id ? "bg-primary/10" : "hover:bg-card"
                            )}
                          >
                            <span className="font-medium">{proj.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Notes */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Notes (Optional)
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
                className="w-full py-6 text-lg font-semibold gradient-primary text-primary-foreground rounded-xl"
              >
                Add {type === 'expense' ? 'Expense' : 'Income'} →
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

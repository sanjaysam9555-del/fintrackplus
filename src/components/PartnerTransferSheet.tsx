import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CreditCard, Banknote, CalendarIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinanceStore } from "@/lib/store";
import { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface PartnerTransferSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const PartnerTransferSheet = ({ isOpen, onClose, userId }: PartnerTransferSheetProps) => {
  const { partners, categories, addTransaction } = useFinanceStore();
  
  const [fromPartnerId, setFromPartnerId] = useState("");
  const [toPartnerId, setToPartnerId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [showFromPartners, setShowFromPartners] = useState(false);
  const [showToPartners, setShowToPartners] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const fromPartner = partners.find(p => p.id === fromPartnerId);
  const toPartner = partners.find(p => p.id === toPartnerId);
  
  // Find misc expense/income categories for transfers
  const expenseCategory = categories.find(c => c.type === 'expense') || categories[0];
  const incomeCategory = categories.find(c => c.type === 'income') || categories[0];
  
  const resetForm = () => {
    setFromPartnerId("");
    setToPartnerId("");
    setAmount("");
    setPaymentMethod("cash");
    setDate(new Date());
    setNotes("");
  };
  
  const handleSubmit = async () => {
    if (!amount || !fromPartnerId || !toPartnerId || !expenseCategory || !incomeCategory) return;
    
    const transferAmount = parseFloat(amount);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const currentTime = format(new Date(), 'HH:mm:ss');
    
    // Pre-generate IDs for cross-linking
    const expenseId = uuidv4();
    const incomeId = uuidv4();
    
    // Create expense from source partner (linked to income)
    await addTransaction({
      type: 'expense',
      amount: transferAmount,
      title: `Transfer to ${toPartner?.name}`,
      vendor: 'Partner Transfer',
      categoryId: expenseCategory.id,
      partnerId: fromPartnerId,
      paymentMethod,
      date: formattedDate,
      time: currentTime,
      notes: notes || `Transfer to ${toPartner?.name}`,
      linkedTransactionId: incomeId,
    }, userId, expenseId);
    
    // Create income for destination partner (linked to expense)
    await addTransaction({
      type: 'income',
      amount: transferAmount,
      title: `Transfer from ${fromPartner?.name}`,
      vendor: 'Partner Transfer',
      categoryId: incomeCategory.id,
      partnerId: toPartnerId,
      paymentMethod,
      date: formattedDate,
      time: currentTime,
      notes: notes || `Transfer from ${fromPartner?.name}`,
      linkedTransactionId: expenseId,
    }, userId, incomeId);
    
    toast.success('Transfer Complete', {
      description: `${CURRENCY_SYMBOL}${transferAmount.toLocaleString()} from ${fromPartner?.name} to ${toPartner?.name}`,
      duration: 3000,
    });
    
    resetForm();
    onClose();
  };
  
  const canSubmit = amount && fromPartnerId && toPartnerId && fromPartnerId !== toPartnerId;
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-card rounded-t-3xl max-h-[85vh] overflow-hidden"
          >
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-muted rounded-full" />
            </div>
            
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-accent-foreground" />
                <h2 className="text-xl font-bold">Partner Transfer</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            
            <ScrollArea className="h-[calc(85vh-160px)]">
              <div className="p-4 space-y-4 pb-8">
                {/* Transfer Visual */}
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="flex flex-col items-center gap-2">
                    {fromPartner ? (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                        style={{ backgroundColor: fromPartner.color }}
                      >
                        {fromPartner.name.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users size={20} className="text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">From</span>
                  </div>
                  
                  <ArrowRight size={24} className="text-accent-foreground" />
                  
                  <div className="flex flex-col items-center gap-2">
                    {toPartner ? (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                        style={{ backgroundColor: toPartner.color }}
                      >
                        {toPartner.name.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users size={20} className="text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">To</span>
                  </div>
                </div>
                
                {/* From Partner */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">From Partner *</Label>
                  <Popover open={showFromPartners} onOpenChange={setShowFromPartners}>
                    <PopoverTrigger asChild>
                      <button className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center justify-between min-h-[48px]">
                        {fromPartner ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: fromPartner.color }}
                            >
                              {fromPartner.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{fromPartner.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Select partner...</span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2 bg-card z-[70]" align="start">
                      <div className="space-y-1">
                        {partners.map((partner) => (
                          <button
                            key={partner.id}
                            onClick={() => {
                              setFromPartnerId(partner.id);
                              setShowFromPartners(false);
                            }}
                            disabled={partner.id === toPartnerId}
                            className={cn(
                              "w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors",
                              fromPartnerId === partner.id ? "bg-primary/10" : "hover:bg-muted",
                              partner.id === toPartnerId && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: partner.color }}
                            >
                              {partner.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{partner.name}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* To Partner */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">To Partner *</Label>
                  <Popover open={showToPartners} onOpenChange={setShowToPartners}>
                    <PopoverTrigger asChild>
                      <button className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center justify-between min-h-[48px]">
                        {toPartner ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: toPartner.color }}
                            >
                              {toPartner.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{toPartner.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Select partner...</span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2 bg-card z-[70]" align="start">
                      <div className="space-y-1">
                        {partners.map((partner) => (
                          <button
                            key={partner.id}
                            onClick={() => {
                              setToPartnerId(partner.id);
                              setShowToPartners(false);
                            }}
                            disabled={partner.id === fromPartnerId}
                            className={cn(
                              "w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors",
                              toPartnerId === partner.id ? "bg-primary/10" : "hover:bg-muted",
                              partner.id === fromPartnerId && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: partner.color }}
                            >
                              {partner.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{partner.name}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
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
                
                {/* Payment Method */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Payment Method</Label>
                  <div className="flex gap-2 mt-1">
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
                  </div>
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
              </div>
            </ScrollArea>
            
            {/* Sticky Transfer Button */}
            <div className="p-4 border-t border-border bg-card shrink-0">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-5 text-base font-semibold gradient-primary text-primary-foreground rounded-xl"
              >
                Transfer {amount ? `${CURRENCY_SYMBOL}${parseFloat(amount).toLocaleString()}` : ''} →
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

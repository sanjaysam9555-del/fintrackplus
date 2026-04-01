import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownUp, Banknote, CreditCard, CalendarIcon, Landmark, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFinanceStore } from "@/lib/store";
import { getPartnerId } from "@/lib/partnerUtils";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Partner } from "@/lib/types";

interface SelfTransferSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  preselectedPartner?: Partner;
}

export const SelfTransferSheet = ({ isOpen, onClose, userId, preselectedPartner }: SelfTransferSheetProps) => {
  const { partners, categories, addSelfTransfer } = useFinanceStore();

  const [selectedPartnerId, setSelectedPartnerId] = useState(preselectedPartner ? getPartnerId(preselectedPartner) : "");
  const [direction, setDirection] = useState<"withdraw" | "deposit">("withdraw");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [showPartners, setShowPartners] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Update selected partner when preselectedPartner changes
  const effectivePartnerId = preselectedPartner ? getPartnerId(preselectedPartner) : selectedPartnerId;

  const selectedPartner = partners.find(p => getPartnerId(p) === effectivePartnerId);

  // Company accounts are online-only, so only "deposit" (cash→online) and "withdraw" (online→cash) make sense
  const isCompanyAccount = selectedPartner?.isCompanyAccount;

  const expenseCategory = categories.find(c => c.name === 'Not Specified' && c.type === 'expense') ||
    categories.find(c => c.type === 'expense');
  const incomeCategory = categories.find(c => c.name === 'Not Specified' && c.type === 'income') ||
    categories.find(c => c.type === 'income');

  const resetForm = () => {
    if (!preselectedPartner) setSelectedPartnerId("");
    setDirection("withdraw");
    setAmount("");
    setDate(new Date());
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!amount || !effectivePartnerId) return;
    if (!expenseCategory || !incomeCategory) {
      toast.error('Missing default categories. Please wait for sync to complete.');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) return;

    const formattedDate = format(date, 'yyyy-MM-dd');
    const currentTime = format(new Date(), 'HH:mm:ss');

    await addSelfTransfer({
      partnerId: effectivePartnerId,
      partnerName: selectedPartner?.name || '',
      direction,
      amount: transferAmount,
      date: formattedDate,
      time: currentTime,
      notes: notes || undefined,
      expenseCategoryId: expenseCategory.id,
      incomeCategoryId: incomeCategory.id,
    }, userId);

    const dirLabel = direction === 'withdraw' ? 'Withdrawal' : 'Deposit';
    toast.success(`${dirLabel} Complete`, {
      description: `${CURRENCY_SYMBOL}${transferAmount.toLocaleString()} — ${selectedPartner?.name}`,
      duration: 3000,
    });

    resetForm();
    onClose();
  };

  const canSubmit = amount && effectivePartnerId && parseFloat(amount) > 0;

  // Non-company partners that have both cash and online
  const eligiblePartners = partners;

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
                <ArrowDownUp size={20} className="text-accent-foreground" />
                <h2 className="text-xl font-bold">Cash ↔ Online Transfer</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                <X size={20} />
              </button>
            </div>

            <ScrollArea className="h-[calc(85vh-160px)]">
              <div className="p-4 space-y-4 pb-8">
                {/* Direction Visual */}
                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                      direction === 'withdraw' ? "bg-primary/10" : "bg-muted"
                    )}>
                      {direction === 'withdraw' ? (
                        <CreditCard size={24} className="text-primary" />
                      ) : (
                        <Banknote size={24} className="text-primary" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">From</span>
                    <span className="text-xs font-medium">
                      {direction === 'withdraw' ? 'Online' : 'Cash'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    {direction === 'withdraw' ? (
                      <ArrowDown size={20} className="text-primary rotate-[-90deg]" />
                    ) : (
                      <ArrowUp size={20} className="text-primary rotate-[-90deg]" />
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                      direction === 'deposit' ? "bg-primary/10" : "bg-muted"
                    )}>
                      {direction === 'withdraw' ? (
                        <Banknote size={24} className="text-primary" />
                      ) : (
                        <CreditCard size={24} className="text-primary" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">To</span>
                    <span className="text-xs font-medium">
                      {direction === 'withdraw' ? 'Cash' : 'Online'}
                    </span>
                  </div>
                </div>

                {/* Partner Selection (skip if preselected) */}
                {!preselectedPartner && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Team Member *</Label>
                    <Popover open={showPartners} onOpenChange={setShowPartners}>
                      <PopoverTrigger asChild>
                        <button className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center justify-between min-h-[48px]">
                          {selectedPartner ? (
                            <div className="flex items-center gap-2">
                              {selectedPartner.isCompanyAccount ? (
                                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                                  <Landmark size={14} className="text-primary" />
                                </div>
                              ) : selectedPartner.avatarUrl ? (
                                <img src={selectedPartner.avatarUrl} alt={selectedPartner.name} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: selectedPartner.color }}>
                                  {selectedPartner.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm font-medium">{selectedPartner.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Select Team Member</span>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2 bg-card z-[70]" align="start">
                        <div className="space-y-1">
                          {eligiblePartners.map((partner) => (
                            <button
                              key={partner.id}
                              onClick={() => {
                                setSelectedPartnerId(getPartnerId(partner));
                                setShowPartners(false);
                              }}
                              className={cn(
                                "w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors",
                                effectivePartnerId === getPartnerId(partner) ? "bg-primary/10" : "hover:bg-muted"
                              )}>
                              {partner.isCompanyAccount ? (
                                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                                  <Landmark size={14} className="text-primary" />
                                </div>
                              ) : partner.avatarUrl ? (
                                <img src={partner.avatarUrl} alt={partner.name} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: partner.color }}>
                                  {partner.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm font-medium">{partner.name}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Direction Toggle */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Direction</Label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setDirection('withdraw')}
                      className={cn(
                        "flex-1 p-3 rounded-xl flex items-center justify-center gap-2 border-2 transition-colors",
                        direction === 'withdraw'
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted"
                      )}>
                      <ArrowDown size={16} className={direction === 'withdraw' ? "text-primary" : "text-muted-foreground"} />
                      <span className={cn("text-sm font-medium", direction === 'withdraw' ? "text-foreground" : "text-muted-foreground")}>
                        Withdraw
                      </span>
                      <span className={cn("text-[10px]", direction === 'withdraw' ? "text-muted-foreground" : "text-muted-foreground/60")}>
                        Online→Cash
                      </span>
                    </button>
                    <button
                      onClick={() => setDirection('deposit')}
                      className={cn(
                        "flex-1 p-3 rounded-xl flex items-center justify-center gap-2 border-2 transition-colors",
                        direction === 'deposit'
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted"
                      )}>
                      <ArrowUp size={16} className={direction === 'deposit' ? "text-primary" : "text-muted-foreground"} />
                      <span className={cn("text-sm font-medium", direction === 'deposit' ? "text-foreground" : "text-muted-foreground")}>
                        Deposit
                      </span>
                      <span className={cn("text-[10px]", direction === 'deposit' ? "text-muted-foreground" : "text-muted-foreground/60")}>
                        Cash→Online
                      </span>
                    </button>
                  </div>
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

                {/* Date Picker */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date</Label>
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <button className="w-full mt-1 p-3 bg-muted rounded-xl flex items-center gap-2">
                        <CalendarIcon size={16} className="text-muted-foreground" />
                        <span className="text-sm">{format(date, 'PPP')}</span>
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Notes</Label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. ATM withdrawal, bank deposit"
                    className="w-full mt-1 p-3 bg-muted rounded-xl text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Submit */}
            <div className="p-4 border-t border-border">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                <ArrowDownUp size={18} className="mr-2" />
                {direction === 'withdraw' ? 'Withdraw to Cash' : 'Deposit to Online'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFinanceStore } from "@/lib/store";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Partner } from "@/lib/types";

interface SelfTransferSheetProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  userId?: string;
}

export const SelfTransferSheet = ({ isOpen, onClose, partner, userId }: SelfTransferSheetProps) => {
  const { addSelfTransfer, categories } = useFinanceStore();
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  const timeStr = today.toTimeString().slice(0, 5);

  // Find "Not Specified" categories for expense/income
  const expenseCat = categories.find(c => c.name === 'Not Specified' && c.type === 'expense');
  const incomeCat = categories.find(c => c.name === 'Not Specified' && c.type === 'income');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !partner) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!expenseCat || !incomeCat) {
      toast.error("Default categories not found");
      return;
    }

    // For regular partners use userId, for company accounts use id
    const partnerId = partner.isCompanyAccount ? partner.id : (partner.userId || partner.id);

    addSelfTransfer({
      partnerId,
      partnerName: partner.name,
      direction,
      amount: numAmount,
      date: dateStr,
      time: timeStr,
      notes: notes.trim() || undefined,
      expenseCategoryId: expenseCat.id,
      incomeCategoryId: incomeCat.id,
    }, userId);

    toast.success(`${direction === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${CURRENCY_SYMBOL}${numAmount.toLocaleString()} recorded`);
    setAmount("");
    setNotes("");
    setDirection('deposit');
    onClose();
  };

  if (!partner) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left mb-4">
          <SheetTitle>Cash ↔ Online — {partner.name}</SheetTitle>
          <SheetDescription>Move money between Cash and Online for this partner</SheetDescription>
        </SheetHeader>

        {/* Direction Toggle */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            onClick={() => setDirection('deposit')}
            className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
              direction === 'deposit'
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground"
            )}
          >
            <ArrowDownToLine size={16} />
            Deposit (Cash → Online)
          </button>
          <button
            onClick={() => setDirection('withdraw')}
            className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
              direction === 'withdraw'
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground"
            )}
          >
            <ArrowUpFromLine size={16} />
            Withdraw (Online → Cash)
          </button>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{CURRENCY_SYMBOL}</span>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-7 text-lg font-semibold"
              autoFocus
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Notes (optional)</label>
          <Textarea
            placeholder="Add a note..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <Button onClick={handleSubmit} className="w-full" size="lg">
          Confirm {direction === 'deposit' ? 'Deposit' : 'Withdrawal'}
        </Button>
      </SheetContent>
    </Sheet>
  );
};

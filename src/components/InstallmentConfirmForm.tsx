import { useState } from "react";
import { Banknote, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceStore } from "@/lib/store";
import { PaymentMethod } from "@/lib/types";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface InstallmentConfirmFormProps {
  defaultPaymentMethod: PaymentMethod;
  defaultHandledBy?: string;
  amount: number;
  onConfirm: (paymentMethod: PaymentMethod, handledBy?: string) => void;
  onCancel: () => void;
}

export const InstallmentConfirmForm = ({
  defaultPaymentMethod,
  defaultHandledBy,
  amount,
  onConfirm,
  onCancel,
}: InstallmentConfirmFormProps) => {
  const { partners } = useFinanceStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultPaymentMethod);
  const [handledBy, setHandledBy] = useState<string | undefined>(defaultHandledBy);

  return (
    <div className="p-3 bg-muted/50 border border-border rounded-lg space-y-3 mt-2">
      <p className="text-xs font-medium text-muted-foreground">
        Confirm receipt of {CURRENCY_SYMBOL}{amount.toLocaleString('en-IN')}
      </p>

      {/* Payment Method */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Payment Method</Label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
          className="flex gap-3"
        >
          <label
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors flex-1",
              paymentMethod === "cash"
                ? "border-primary bg-primary/5"
                : "border-border"
            )}
          >
            <RadioGroupItem value="cash" id="cash" />
            <Banknote size={14} className="text-muted-foreground" />
            <span className="text-sm">Cash</span>
          </label>
          <label
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors flex-1",
              paymentMethod === "online"
                ? "border-primary bg-primary/5"
                : "border-border"
            )}
          >
            <RadioGroupItem value="online" id="online" />
            <Smartphone size={14} className="text-muted-foreground" />
            <span className="text-sm">Online</span>
          </label>
        </RadioGroup>
      </div>

      {/* Partner Override */}
      {partners.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Handled By</Label>
          <Select
            value={handledBy || "__none__"}
            onValueChange={(v) => setHandledBy(v === "__none__" ? undefined : v)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="No partner" />
            </SelectTrigger>
            <SelectContent className="z-[90]">
              <SelectItem value="__none__">No partner</SelectItem>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-success hover:bg-success/90 text-white text-xs"
          onClick={() => onConfirm(paymentMethod, handledBy)}
        >
          Confirm Payment
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-muted-foreground"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

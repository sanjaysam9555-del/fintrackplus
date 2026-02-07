import { X, Check, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { PlannedInstallment } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface InstallmentRowProps {
  installment: PlannedInstallment;
  index: number;
  onUpdate: (updates: Partial<PlannedInstallment>) => void;
  onRemove: () => void;
  showConfirmButton?: boolean;
  onConfirm?: () => void;
  readOnly?: boolean;
}

export const InstallmentRow = ({
  installment,
  index,
  onUpdate,
  onRemove,
  showConfirmButton,
  onConfirm,
  readOnly = false
}: InstallmentRowProps) => {
  return (
    <div className={cn(
      "p-3 border rounded-xl space-y-2",
      installment.status === 'received' 
        ? "bg-success/5 border-success/30" 
        : "bg-muted/50 border-border"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
            installment.status === 'received' 
              ? "bg-success text-white" 
              : "bg-muted-foreground/20 text-muted-foreground"
          )}>
            {installment.status === 'received' ? <Check size={12} /> : index}
          </div>
          <span className="text-sm font-medium">
            Installment #{index}
          </span>
          {installment.status === 'received' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success rounded-full">
              Received
            </span>
          )}
        </div>
        {!readOnly && installment.status !== 'received' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <X size={14} />
          </Button>
        )}
      </div>
      
      {readOnly || installment.status === 'received' ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Amount:</span>
          <span className="font-semibold">
            {CURRENCY_SYMBOL}{installment.amount.toLocaleString('en-IN')}
          </span>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="number"
              value={installment.amount || ''}
              onChange={(e) => onUpdate({ amount: parseFloat(e.target.value) || 0 })}
              placeholder="Amount"
              className="h-8 text-sm"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <CalendarIcon size={12} className="mr-1" />
                {installment.expectedDate 
                  ? format(parseISO(installment.expectedDate), 'MMM dd') 
                  : 'Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[80]">
              <Calendar
                mode="single"
                selected={installment.expectedDate ? parseISO(installment.expectedDate) : undefined}
                onSelect={(d) => onUpdate({ expectedDate: d ? format(d, 'yyyy-MM-dd') : undefined })}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      {installment.expectedDate && installment.status === 'pending' && (
        <p className="text-xs text-muted-foreground">
          Expected: {format(parseISO(installment.expectedDate), 'MMM dd, yyyy')}
        </p>
      )}
      
      {installment.receivedDate && installment.status === 'received' && (
        <p className="text-xs text-success">
          Received on: {format(parseISO(installment.receivedDate), 'MMM dd, yyyy')}
        </p>
      )}
      
      {showConfirmButton && installment.status === 'pending' && (
        <Button
          onClick={onConfirm}
          size="sm"
          className="w-full bg-success hover:bg-success/90 text-white"
        >
          <Check size={14} className="mr-1" />
          Confirm Payment Received
        </Button>
      )}
    </div>
  );
};

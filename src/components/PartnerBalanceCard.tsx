import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronDown, Banknote, CreditCard } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const PartnerBalanceCard = () => {
  const { partners, getPartnerBalances } = useFinanceStore();
  const [isOpen, setIsOpen] = useState(true);
  
  const partnerBalances = getPartnerBalances();
  
  // Don't render if no partners
  if (partners.length === 0) {
    return null;
  }
  
  // Calculate totals
  const totalCash = partnerBalances.reduce((sum, pb) => sum + pb.cashBalance, 0);
  const totalOnline = partnerBalances.reduce((sum, pb) => sum + pb.onlineBalance, 0);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-card border border-border overflow-hidden"
      >
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm">Partner Balances</h3>
              <p className="text-xs text-muted-foreground">
                {partnerBalances.length} partner{partnerBalances.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-bold text-sm">
                {CURRENCY_SYMBOL}{(totalCash + totalOnline).toLocaleString()}
              </p>
            </div>
            <ChevronDown 
              size={18} 
              className={cn(
                "text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} 
            />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border"
              >
                {partnerBalances.map(({ partner, cashBalance, onlineBalance }, index) => (
                  <div 
                    key={partner.id}
                    className={cn(
                      "p-4",
                      index !== partnerBalances.length - 1 && "border-b border-border"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: partner.color }}
                      >
                        {partner.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{partner.name}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <Banknote size={12} />
                          <span className="text-[10px] uppercase tracking-wide">Cash</span>
                        </div>
                        <p className={cn(
                          "text-base font-bold",
                          cashBalance >= 0 ? "text-foreground" : "text-destructive"
                        )}>
                          {cashBalance < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(cashBalance).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <CreditCard size={12} />
                          <span className="text-[10px] uppercase tracking-wide">Online</span>
                        </div>
                        <p className={cn(
                          "text-base font-bold",
                          onlineBalance >= 0 ? "text-foreground" : "text-destructive"
                        )}>
                          {onlineBalance < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(onlineBalance).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
};

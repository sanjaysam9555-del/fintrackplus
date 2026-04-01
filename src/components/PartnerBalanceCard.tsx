import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronDown, Banknote, CreditCard, ArrowLeftRight, Landmark, ArrowDownUp } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { PartnerTransferSheet } from "./PartnerTransferSheet";
import { SelfTransferSheet } from "./SelfTransferSheet";
import { useAuth } from "@/hooks/useAuth";
import { Partner } from "@/lib/types";

interface PartnerBalanceCardProps {
  dateRange?: { start: string; end: string };
}

export const PartnerBalanceCard = ({ dateRange }: PartnerBalanceCardProps) => {
  const { partners, getPartnerBalancesForPeriod } = useFinanceStore();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [showTransferSheet, setShowTransferSheet] = useState(false);
  
  // Default to current FY if no dateRange provided
  const range = useMemo(() => {
    if (dateRange) return dateRange;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    return {
      start: `${fyStartYear}-04-01`,
      end: `${fyStartYear + 1}-03-31`,
    };
  }, [dateRange]);
  
  const partnerBalances = useMemo(() => {
    return getPartnerBalancesForPeriod(range.start, range.end);
  }, [getPartnerBalancesForPeriod, range]);
  
  // Don't render if no partners
  if (partners.length === 0) {
    return null;
  }
  
  // Calculate totals
  const totalClosingCash = partnerBalances.reduce((sum, pb) => sum + pb.closingCashBalance, 0);
  const totalClosingOnline = partnerBalances.reduce((sum, pb) => sum + pb.closingOnlineBalance, 0);
  
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
              <h3 className="font-semibold text-sm">Financial Holdings</h3>
              <p className="text-xs text-muted-foreground">
                {partnerBalances.length} partner{partnerBalances.length !== 1 ? 's' : ''} • Closing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-bold text-sm">
                {CURRENCY_SYMBOL}{(totalClosingCash + totalClosingOnline).toLocaleString()}
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
                {partnerBalances.map(({ 
                  partner, 
                  closingCashBalance, 
                  closingOnlineBalance, 
                  periodCashTxnCount, 
                  periodOnlineTxnCount 
                }, index) => (
                  <div 
                    key={partner.id}
                    className={cn(
                      "p-4",
                      index !== partnerBalances.length - 1 && "border-b border-border"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {partner.isCompanyAccount ? (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Landmark size={16} className="text-primary" />
                        </div>
                      ) : partner.avatarUrl ? (
                        <img src={partner.avatarUrl} alt={partner.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: partner.color }}
                        >
                          {partner.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">{partner.name}</span>
                        {partner.isCompanyAccount && (
                          <p className="text-[10px] text-muted-foreground">Company Account</p>
                        )}
                      </div>
                    </div>
                    
                    <div className={cn("grid gap-3", partner.isCompanyAccount ? "grid-cols-1" : "grid-cols-2")}>
                      {!partner.isCompanyAccount && (
                        <div className="bg-muted/50 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                            <Banknote size={12} />
                            <span className="text-[10px] uppercase tracking-wide">Cash</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {periodCashTxnCount} txn{periodCashTxnCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className={cn(
                            "text-base font-bold",
                            closingCashBalance >= 0 ? "text-foreground" : "text-destructive"
                          )}>
                            {closingCashBalance < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(closingCashBalance).toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div className="bg-muted/50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <CreditCard size={12} />
                          <span className="text-[10px] uppercase tracking-wide">{partner.isCompanyAccount ? 'Bank Balance' : 'Online'}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {periodOnlineTxnCount} txn{periodOnlineTxnCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className={cn(
                          "text-base font-bold",
                          closingOnlineBalance >= 0 ? "text-foreground" : "text-destructive"
                        )}>
                          {closingOnlineBalance < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(closingOnlineBalance).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Transfer Button */}
                {partners.length >= 2 && (
                  <div className="p-4 border-t border-border">
                    <Button
                      onClick={() => setShowTransferSheet(true)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <ArrowLeftRight size={16} />
                      Transfer Between Team
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </motion.div>
      
      <PartnerTransferSheet
        isOpen={showTransferSheet}
        onClose={() => setShowTransferSheet(false)}
        userId={user?.id}
      />
    </Collapsible>
  );
};
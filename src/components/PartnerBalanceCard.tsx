import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronDown, Banknote, CreditCard, ArrowLeftRight, Landmark, ArrowUpDown } from "lucide-react";
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
  const [selfTransferPartner, setSelfTransferPartner] = useState<Partner | null>(null);
  
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
  
  // Separate company account from regular partners
  const companyBalances = partnerBalances.filter(pb => pb.partner.isCompanyAccount);
  const regularBalances = partnerBalances.filter(pb => !pb.partner.isCompanyAccount);
  
  // Calculate totals (regular partners only for cash/online split)
  const totalClosingCash = regularBalances.reduce((sum, pb) => sum + pb.closingCashBalance, 0);
  const totalClosingOnline = regularBalances.reduce((sum, pb) => sum + pb.closingOnlineBalance, 0);
  const companyTotal = companyBalances.reduce((sum, pb) => sum + pb.closingOnlineBalance, 0);
  
  return (
    <>
      {/* Company Bank Account Card */}
      {companyBalances.map(({ partner, closingOnlineBalance, periodOnlineTxnCount }) => (
        <motion.div
          key={partner.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card border border-border overflow-hidden mb-3"
        >
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Landmark size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{partner.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {periodOnlineTxnCount} txn{periodOnlineTxnCount !== 1 ? 's' : ''} • Bank Account
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className={cn(
                  "text-lg font-bold",
                  closingOnlineBalance >= 0 ? "text-foreground" : "text-destructive"
                )}>
                  {closingOnlineBalance < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(closingOnlineBalance).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Regular Partners Card */}
      {regularBalances.length > 0 && (
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
                    {regularBalances.length} partner{regularBalances.length !== 1 ? 's' : ''} • Closing
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
                    {regularBalances.map(({ 
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
                          index !== regularBalances.length - 1 && "border-b border-border"
                        )}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {partner.avatarUrl ? (
                            <img src={partner.avatarUrl} alt={partner.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: partner.color }}
                            >
                              {partner.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium flex-1">{partner.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelfTransferPartner(partner); }}
                            className="p-1.5 rounded-lg bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Cash ↔ Online"
                          >
                            <ArrowUpDown size={14} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
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
                          <div className="bg-muted/50 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                              <CreditCard size={12} />
                              <span className="text-[10px] uppercase tracking-wide">Online</span>
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
        </Collapsible>
      )}
      
      <PartnerTransferSheet
        isOpen={showTransferSheet}
        onClose={() => setShowTransferSheet(false)}
        userId={user?.id}
      />
    </>
  );
};

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { X, FolderKanban, Store, Receipt, ArrowDown, ArrowUp, StickyNote, Loader2, ChevronDown } from "lucide-react";
import { Project, Transaction } from "@/lib/types";
import { useFinanceStore } from "@/lib/store";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { TransactionItem } from "./TransactionItem";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface VendorBreakdown {
  vendor: string;
  amount: number;
  count: number;
  lastDate: string;
}

interface ProjectDetailSheetProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  spent: number;
  income: number;
  transactions: Transaction[];
  vendorBreakdown: VendorBreakdown[];
  userId?: string;
  onEditSheetChange?: (isOpen: boolean) => void;
}

export const ProjectDetailSheet = ({
  project,
  isOpen,
  onClose,
  spent,
  income,
  transactions,
  vendorBreakdown,
  userId,
  onEditSheetChange,
}: ProjectDetailSheetProps) => {
  const { getCategoryById, updateProject } = useFinanceStore();
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  
  // Sort and separate transactions - memoize for use in hooks
  const { sortedTransactions, incomeTransactions, expenseTransactions } = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return {
      sortedTransactions: sorted,
      incomeTransactions: sorted.filter(t => t.type === 'income'),
      expenseTransactions: sorted.filter(t => t.type === 'expense'),
    };
  }, [transactions]);
  
  const toggleVendor = useCallback((vendor: string) => {
    setExpandedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendor)) {
        newSet.delete(vendor);
      } else {
        newSet.add(vendor);
      }
      return newSet;
    });
  }, []);
  
  // Get transactions for a specific vendor
  const getVendorTransactions = useCallback((vendorName: string) => {
    return expenseTransactions.filter(t => t.vendor === vendorName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenseTransactions]);
  
  // Sync notes state with project
  useEffect(() => {
    if (project) {
      setNotes(project.notes || "");
    }
  }, [project]);
  
  // Debounced save for notes
  const saveNotes = useCallback((newNotes: string) => {
    if (!project || !userId) return;
    
    setIsSavingNotes(true);
    updateProject(project.id, { notes: newNotes }, userId);
    
    // Show saving indicator briefly
    setTimeout(() => setIsSavingNotes(false), 500);
  }, [project, userId, updateProject]);
  
  // Debounce notes updates
  useEffect(() => {
    if (!project) return;
    
    const timer = setTimeout(() => {
      if (notes !== (project.notes || "")) {
        saveNotes(notes);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [notes, project, saveNotes]);
  
  if (!project) return null;

  const net = income - spent;
  const actualMargin = project.budgetLimit - spent;
  const expectedMargin = project.margin || 0;
  const isHealthy = actualMargin >= expectedMargin;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh] overflow-hidden">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${project.color}20` }}
            >
              <FolderKanban size={22} style={{ color: project.color }} />
            </div>
            <div className="flex-1">
              <DrawerTitle className="text-left">{project.name}</DrawerTitle>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-4 space-y-6">
            {/* Financial Summary - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-lg font-bold">₹{project.budgetLimit.toLocaleString()}</p>
              </div>
              <div className="bg-green-500/10 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Income</p>
                <div className="flex items-center gap-1">
                  <ArrowDown size={14} className="text-green-500" />
                  <p className="text-lg font-bold text-green-500">₹{income.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Expenses</p>
                <div className="flex items-center gap-1">
                  <ArrowUp size={14} className="text-red-500" />
                  <p className="text-lg font-bold text-red-500">₹{spent.toLocaleString()}</p>
                </div>
              </div>
              <div className={cn("rounded-xl p-3", net >= 0 ? "bg-green-500/10" : "bg-red-500/10")}>
                <p className="text-xs text-muted-foreground">Net</p>
                <p className={cn("text-lg font-bold", net >= 0 ? "text-green-500" : "text-red-500")}>
                  {net >= 0 ? '+' : ''}₹{net.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Expected Margin Comparison */}
            {expectedMargin > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-sm font-medium mb-2">Margin Analysis</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expected Margin</span>
                  <span className="font-medium">₹{expectedMargin.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Actual Margin</span>
                  <span className={cn("font-medium", isHealthy ? "text-green-500" : "text-red-500")}>
                    ₹{actualMargin.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-border">
                  <span className="text-muted-foreground">Difference</span>
                  <span className={cn("font-bold", actualMargin >= expectedMargin ? "text-green-500" : "text-red-500")}>
                    {actualMargin >= expectedMargin ? '+' : ''}₹{(actualMargin - expectedMargin).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Project Notes */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <StickyNote size={18} className="text-muted-foreground" />
                Project Notes
                {isSavingNotes && (
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                )}
              </h3>
              <Textarea
                placeholder="Add notes about this project..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Income Entries */}
            {incomeTransactions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowDown size={18} className="text-green-500" />
                  Income Entries ({incomeTransactions.length})
                </h3>
                <div className="space-y-2">
                  {incomeTransactions.slice(0, 10).map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      category={getCategoryById(transaction.categoryId)}
                      userId={userId}
                      onEditSheetChange={onEditSheetChange}
                    />
                  ))}
                  {incomeTransactions.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground py-2">
                      +{incomeTransactions.length - 10} more income entries
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Expense Entries */}
            {expenseTransactions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowUp size={18} className="text-red-500" />
                  Expense Entries ({expenseTransactions.length})
                </h3>
                <div className="space-y-2">
                  {expenseTransactions.slice(0, 10).map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      category={getCategoryById(transaction.categoryId)}
                      userId={userId}
                      onEditSheetChange={onEditSheetChange}
                    />
                  ))}
                  {expenseTransactions.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground py-2">
                      +{expenseTransactions.length - 10} more expense entries
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Vendor Breakdown */}
            {vendorBreakdown.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Store size={18} className="text-muted-foreground" />
                  Vendor Payments
                </h3>
                <div className="space-y-2">
                  {vendorBreakdown.map((item) => {
                    const isExpanded = expandedVendors.has(item.vendor);
                    const vendorTxns = getVendorTransactions(item.vendor);
                    
                    return (
                      <Collapsible
                        key={item.vendor}
                        open={isExpanded}
                        onOpenChange={() => toggleVendor(item.vendor)}
                      >
                        <CollapsibleTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-full bg-muted/50 rounded-xl p-3 cursor-pointer hover:bg-muted/70 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ChevronDown 
                                  size={16} 
                                  className={cn(
                                    "text-muted-foreground transition-transform duration-200",
                                    isExpanded && "rotate-180"
                                  )}
                                />
                                <div>
                                  <p className="font-medium text-left">{item.vendor}</p>
                                  <p className="text-xs text-muted-foreground text-left">
                                    {item.count} payment{item.count !== 1 ? 's' : ''} • Last: {format(new Date(item.lastDate), 'MMM d')}
                                  </p>
                                </div>
                              </div>
                              <p className="font-semibold">₹{item.amount.toLocaleString()}</p>
                            </div>
                          </motion.div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 ml-2 space-y-2 border-l-2 border-muted pl-2 overflow-hidden">
                            {vendorTxns.map((txn) => (
                              <TransactionItem
                                key={txn.id}
                                transaction={txn}
                                category={getCategoryById(txn.categoryId)}
                                userId={userId}
                                onEditSheetChange={onEditSheetChange}
                              />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            )}

            {transactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt size={40} className="mx-auto mb-2 opacity-50" />
                <p>No transactions yet for this project</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

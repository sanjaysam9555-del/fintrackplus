import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { X, FolderKanban, Store, Receipt, ArrowDown, ArrowUp, StickyNote, Loader2, ChevronDown, Search, FileText, Upload, Trash2, ExternalLink, File, Image, FileSpreadsheet, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Project, Transaction } from "@/lib/types";
import { useFinanceStore } from "@/lib/store";
import { useProjectDocuments } from "@/hooks/useProjectDocuments";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/constants";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  const { getCategoryById, updateProject, transactions: allTransactions } = useFinanceStore();
  const [isChildEditing, setIsChildEditing] = useState(false);
  
  const handleChildEditSheetChange = useCallback((open: boolean) => {
    setIsChildEditing(open);
    onEditSheetChange?.(open);
  }, [onEditSheetChange]);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [docsOpen, setDocsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { documents, isLoading: docsLoading, isUploading, uploadDocument, deleteDocument } = useProjectDocuments(project?.id, userId);
  
  // Get transactions for this project reactively from the store
  const projectTransactions = useMemo(() => {
    if (!project) return [];
    return allTransactions.filter(t => t.projectId === project.id);
  }, [allTransactions, project?.id]);
  
  // Sort and separate transactions - memoize for use in hooks
  const { sortedTransactions, incomeTransactions, expenseTransactions } = useMemo(() => {
    const sorted = [...projectTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return {
      sortedTransactions: sorted,
      incomeTransactions: sorted.filter(t => t.type === 'income'),
      expenseTransactions: sorted.filter(t => t.type === 'expense'),
    };
  }, [projectTransactions]);
  
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
  
  // Filter transactions based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const term = searchQuery.toLowerCase();
    return sortedTransactions.filter(t => {
      const category = getCategoryById(t.categoryId);
      return (
        t.title?.toLowerCase().includes(term) ||
        t.vendor?.toLowerCase().includes(term) ||
        t.notes?.toLowerCase().includes(term) ||
        category?.name?.toLowerCase().includes(term) ||
        t.amount.toString().includes(term) ||
        formatCurrency(t.amount).toLowerCase().includes(term)
      );
    });
  }, [searchQuery, sortedTransactions, getCategoryById]);
  
  // Clear search when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setIsSearching(false);
    }
  }, [isOpen]);
  
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
  const actualMargin = project.internalCost - spent;
  const expectedMargin = project.clientCost > 0 ? project.clientCost - project.internalCost : 0;
  const isHealthy = actualMargin >= 0;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open && !isChildEditing) onClose(); }} shouldScaleBackground={false} modal={false}>
      <DrawerContent className={cn("max-h-[85vh]", isChildEditing && "hidden")} overlayClassName={cn(isChildEditing && "hidden")}>
        <DrawerHeader className="border-b border-border pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${project.color}20` }}
            >
              <FolderKanban size={22} style={{ color: project.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-left truncate">{project.name}</DrawerTitle>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{project.description}</p>
              )}
            </div>
            <button
              onClick={() => setIsSearching(!isSearching)}
              className={cn(
                "p-2 rounded-full hover:bg-muted transition-colors shrink-0",
                isSearching && "bg-muted"
              )}
            >
              <Search size={18} className="text-muted-foreground" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Inline search bar when active */}
          {isSearching && (
            <div className="mt-3 flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
              <Search size={16} className="text-muted-foreground shrink-0" />
              <input
                autoFocus
                placeholder="Search in this project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="shrink-0">
                  <X size={16} className="text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </DrawerHeader>

        <div 
          className="flex-1 min-h-0 overflow-y-auto w-full"
          data-vaul-no-drag
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {searchQuery.trim() ? (
            /* Search Results View */
            <div className="p-3 space-y-2 w-full min-w-0">
              <p className="text-xs text-muted-foreground mb-2">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} in this project
              </p>
              {searchResults.length > 0 ? (
                <div className="space-y-1.5">
                  {searchResults.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      category={getCategoryById(transaction.categoryId)}
                      userId={userId}
                      onEditSheetChange={handleChildEditSheetChange}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No matching transactions</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          ) : (
          <div className="p-3 space-y-4 w-full min-w-0">
            {/* Financial Summary - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden w-full">
              <div className="bg-card p-3 flex flex-col items-center gap-0.5">
                <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center">
                  <Wallet size={12} className="text-accent-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cost to Client</p>
                <p className="text-sm font-bold text-foreground">₹{project.clientCost.toLocaleString()}</p>
              </div>
              <div className="bg-card p-3 flex flex-col items-center gap-0.5">
                <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ArrowDown size={12} className="text-green-500" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Income</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">₹{income.toLocaleString()}</p>
              </div>
              <div className="bg-card p-3 flex flex-col items-center gap-0.5">
                <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <ArrowUp size={12} className="text-red-500" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expenses</p>
                <p className="text-sm font-bold text-destructive">₹{spent.toLocaleString()}</p>
              </div>
              <div className="bg-card p-3 flex flex-col items-center gap-0.5">
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", (income - spent) >= 0 ? "bg-green-500/10" : "bg-red-500/10")}>
                  {(income - spent) >= 0 ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Margin</p>
                <p className={cn("text-sm font-bold", (income - spent) >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                  ₹{(income - spent).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Project Notes */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <StickyNote size={14} className="text-muted-foreground" />
                Project Notes
                {isSavingNotes && (
                  <Loader2 size={12} className="animate-spin text-muted-foreground" />
                )}
              </h3>
              <Textarea
                placeholder="Add notes about this project..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
              />
            </div>

            {/* Income Entries */}
            {incomeTransactions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <ArrowDown size={14} className="text-green-500" />
                  Income Entries ({incomeTransactions.length})
                </h3>
                <div className="space-y-1.5 w-full overflow-hidden">
                  {incomeTransactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      category={getCategoryById(transaction.categoryId)}
                      userId={userId}
                      onEditSheetChange={handleChildEditSheetChange}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Expense Entries */}
            {expenseTransactions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <ArrowUp size={14} className="text-red-500" />
                  Expense Entries ({expenseTransactions.length})
                </h3>
                <div className="space-y-1.5 w-full overflow-hidden">
                  {expenseTransactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      category={getCategoryById(transaction.categoryId)}
                      userId={userId}
                      onEditSheetChange={handleChildEditSheetChange}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Vendor Breakdown */}
            {vendorBreakdown.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Store size={14} className="text-muted-foreground" />
                  Vendor Payments
                </h3>
                <div className="space-y-1.5">
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
                            className="w-full bg-muted/50 rounded-lg p-2 cursor-pointer hover:bg-muted/70 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <ChevronDown 
                                  size={14} 
                                  className={cn(
                                    "text-muted-foreground transition-transform duration-200 shrink-0",
                                    isExpanded && "rotate-180"
                                  )}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-left truncate">{item.vendor}</p>
                                  <p className="text-[10px] text-muted-foreground text-left">
                                    {item.count} payment{item.count !== 1 ? 's' : ''} • Last: {format(new Date(item.lastDate), 'MMM d')}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold shrink-0">₹{item.amount.toLocaleString()}</p>
                            </div>
                          </motion.div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-1.5 ml-2 space-y-1.5 border-l-2 border-muted pl-2 min-w-0">
                            {vendorTxns.map((txn) => (
                              <TransactionItem
                                key={txn.id}
                                transaction={txn}
                                category={getCategoryById(txn.categoryId)}
                                userId={userId}
                                onEditSheetChange={handleChildEditSheetChange}
                                compact
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

            {/* Documents Section */}
            <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between py-2">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <FileText size={14} className="text-muted-foreground" />
                    Documents {documents.length > 0 && `(${documents.length})`}
                  </h3>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${docsOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 pb-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 20 * 1024 * 1024) {
                          toast.error("File too large. Max 20MB.");
                          return;
                        }
                        uploadDocument(file);
                      }
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-muted-foreground/20 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload size={14} /> Upload Document</>
                    )}
                  </button>

                  {docsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={20} className="animate-spin text-muted-foreground" />
                    </div>
                  ) : documents.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No documents yet</p>
                  ) : (
                    documents.map(doc => {
                      const getDocIcon = () => {
                        if (doc.fileType.startsWith('image/')) return Image;
                        if (doc.fileType.includes('spreadsheet') || doc.fileType.includes('excel') || doc.fileName.endsWith('.csv')) return FileSpreadsheet;
                        if (doc.fileType.includes('pdf')) return FileText;
                        return File;
                      };
                      const DocIcon = getDocIcon();
                      const formatSize = (bytes: number) => {
                        if (bytes < 1024) return `${bytes} B`;
                        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                      };

                      return (
                        <div key={doc.id} className="flex items-center gap-2.5 bg-muted/50 rounded-lg p-2.5">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <DocIcon size={16} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.fileName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatSize(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-muted rounded-lg shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={14} className="text-muted-foreground" />
                          </a>
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="p-1.5 hover:bg-destructive/10 rounded-lg shrink-0"
                          >
                            <Trash2 size={14} className="text-destructive" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {sortedTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt size={40} className="mx-auto mb-2 opacity-50" />
                <p>No transactions yet for this project</p>
              </div>
            )}
          </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

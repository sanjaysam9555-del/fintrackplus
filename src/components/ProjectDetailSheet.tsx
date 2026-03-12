import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FolderKanban, Store, Receipt, ArrowDown, ArrowUp, StickyNote, Loader2, ChevronDown, Search, FileText, Upload, Trash2, ExternalLink, File, Image, FileSpreadsheet, TrendingUp, TrendingDown, Save, Check, Calendar, Tag, X, Pencil, Eye, Columns3, List } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProjectDocument } from "@/hooks/useProjectDocuments";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Project, Transaction } from "@/lib/types";
import { useFinanceStore } from "@/lib/store";
import { useProjectDocuments } from "@/hooks/useProjectDocuments";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/constants";
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
  const { getCategoryById, updateProject, transactions: allTransactions, projectLabels } = useFinanceStore();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'list' | 'columns'>('list');
  const [isChildEditing, setIsChildEditing] = useState(false);
  
  const handleChildEditSheetChange = useCallback((open: boolean) => {
    setIsChildEditing(open);
    onEditSheetChange?.(open);
  }, [onEditSheetChange]);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [vendorsOpen, setVendorsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { documents, isLoading: docsLoading, isUploading, uploadDocument, deleteDocument } = useProjectDocuments(project?.id, userId);
  
  // Get transactions for this project reactively from the store
  const projectTransactions = useMemo(() => {
    if (!project) return [];
    return allTransactions.filter(t => t.projectId === project.id);
  }, [allTransactions, project?.id]);
  
  // Sort and separate transactions
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

  const totalIncome = useMemo(() => incomeTransactions.reduce((s, t) => s + t.amount, 0), [incomeTransactions]);
  const totalExpense = useMemo(() => expenseTransactions.reduce((s, t) => s + t.amount, 0), [expenseTransactions]);
  const totalVendorSpend = useMemo(() => vendorBreakdown.reduce((s, v) => s + v.amount, 0), [vendorBreakdown]);
  
  const toggleVendor = useCallback((vendor: string) => {
    setExpandedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendor)) newSet.delete(vendor);
      else newSet.add(vendor);
      return newSet;
    });
  }, []);
  
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
  
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setIsSearching(false);
      setIncomeOpen(false);
      setExpenseOpen(false);
      setVendorsOpen(false);
      setIsEditing(false);
      setPreviewDoc(null);
    }
  }, [isOpen]);
  
  const prevProjectId = useRef<string | null>(null);
  useEffect(() => {
    if (project && project.id !== prevProjectId.current) {
      setNotes(project.notes || "");
      prevProjectId.current = project.id;
    }
  }, [project]);

  useEffect(() => {
    if (!isOpen) {
      prevProjectId.current = null;
    }
  }, [isOpen]);
  
  const [justSaved, setJustSaved] = useState(false);
  const hasUnsavedNotes = notes !== (project?.notes || "");
  
  const handleSaveNotes = useCallback(() => {
    if (!project || !userId) return;
    setIsSavingNotes(true);
    updateProject(project.id, { notes }, userId);
    setTimeout(() => {
      setIsSavingNotes(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    }, 300);
    toast.success("Notes saved");
  }, [project, userId, notes, updateProject]);
  
  const handleStartEditing = useCallback(() => {
    if (!project) return;
    setEditForm({
      name: project.name,
      description: project.description || '',
      color: project.color,
      clientCost: project.clientCost,
      eventDate: project.eventDate || '',
      startDate: project.startDate || '',
      labelIds: project.labelIds || [],
    });
    setIsEditing(true);
  }, [project]);

  const handleSaveEdit = useCallback(() => {
    if (!project || !userId) return;
    updateProject(project.id, editForm, userId);
    setIsEditing(false);
    toast.success("Project updated");
  }, [project, userId, editForm, updateProject]);

  if (!project || !isOpen) return null;

  const net = income - spent;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocIcon = (fileType: string, fileName: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileName.endsWith('.csv')) return FileSpreadsheet;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  return (
    <div className="absolute inset-0 z-20 bg-background flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${project.color}20` }}
          >
            <FolderKanban size={18} style={{ color: project.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{project.name}</h1>
            {project.description && (
              <p className="text-xs text-muted-foreground truncate">{project.description}</p>
            )}
          </div>
          <button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                handleStartEditing();
              }
            }}
            className={cn(
              "p-2 rounded-full hover:bg-muted transition-colors shrink-0",
              isEditing && "bg-muted"
            )}
          >
            {isEditing ? <X size={18} className="text-muted-foreground" /> : <Pencil size={18} className="text-muted-foreground" />}
          </button>
          <button
            onClick={() => setIsSearching(!isSearching)}
            className={cn(
              "p-2 rounded-full hover:bg-muted transition-colors shrink-0",
              isSearching && "bg-muted"
            )}
          >
            <Search size={18} className="text-muted-foreground" />
          </button>
        </div>

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
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {searchQuery.trim() ? (
          <div className="p-4 space-y-2">
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
          <div className="p-4 space-y-4 pb-40">
            {/* Project Info Card / Edit Form */}
            {isEditing ? (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div>
                  <Label className="text-xs">Project Name</Label>
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                    className="mt-1"
                    placeholder="Optional description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Event Date</Label>
                    <Input
                      type="date"
                      value={editForm.eventDate || ''}
                      onChange={(e) => setEditForm(f => ({ ...f, eventDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={editForm.startDate || ''}
                      onChange={(e) => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={editForm.color || '#6366f1'}
                        onChange={(e) => setEditForm(f => ({ ...f, color: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">{editForm.color}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleSaveEdit} className="flex-1">
                    <Check size={14} /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Event Date</p>
                      <p className="text-sm font-medium">
                        {project.eventDate ? format(new Date(project.eventDate), 'MMM d, yyyy') : 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Start Date</p>
                      <p className="text-sm font-medium">
                        {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Created</p>
                    <p className="text-sm font-medium">{format(new Date(project.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                {Array.isArray(project.labelIds) && project.labelIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.labelIds.map(lid => {
                      const label = projectLabels.find(l => l.id === lid);
                      if (!label) return null;
                      return (
                        <span
                          key={lid}
                          className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium flex items-center gap-1"
                          style={{ backgroundColor: label.color }}
                        >
                          <Tag size={8} />
                          #{label.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Financial Summary - 3-column Grid */}
            <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden w-full">
              <div className="bg-card p-3 flex flex-col items-center gap-0.5">
                <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ArrowDown size={12} className="text-green-500" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Income</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">₹{income.toLocaleString()}</p>
              </div>
              <div className="bg-card p-3 flex flex-col items-center gap-0.5">
                <div className="w-6 h-6 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <ArrowUp size={12} className="text-destructive" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expenses</p>
                <p className="text-sm font-bold text-destructive">₹{spent.toLocaleString()}</p>
              </div>
              <div className="bg-card p-3 flex flex-col items-center gap-0.5">
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", net >= 0 ? "bg-green-500/10" : "bg-red-500/10")}>
                  {net >= 0 ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Margin</p>
                <p className={cn("text-sm font-bold", net >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                  ₹{net.toLocaleString()}
                </p>
              </div>
            </div>

            {/* View Mode Toggle - Desktop only */}
            {!isMobile && (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === 'list' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                  title="List view"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('columns')}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === 'columns' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                  title="Column view"
                >
                  <Columns3 size={16} />
                </button>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <StickyNote size={14} className="text-muted-foreground" />
                  Project Notes
                </h3>
                <button
                  onClick={handleSaveNotes}
                  disabled={!hasUnsavedNotes || isSavingNotes}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                    justSaved
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : hasUnsavedNotes
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSavingNotes ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : justSaved ? (
                    <Check size={12} />
                  ) : (
                    <Save size={12} />
                  )}
                  {justSaved ? "Saved" : "Save"}
                </button>
              </div>
              <Textarea
                placeholder="Add notes about this project..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
              />
            </div>

            {/* Documents Section (above income) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <FileText size={14} className="text-muted-foreground" />
                  Documents {documents.length > 0 && `(${documents.length})`}
                </h3>
              </div>
              <div className="space-y-2">
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
                    const isImage = doc.fileType.startsWith('image/');
                    const DocIcon = getDocIcon(doc.fileType, doc.fileName);

                    return (
                      <div key={doc.id} className="flex items-center gap-2.5 bg-muted/50 rounded-lg p-2.5">
                        {isImage ? (
                          <img
                            src={doc.fileUrl}
                            alt={doc.fileName}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={cn("w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0", isImage && "hidden")}>
                          <DocIcon size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.fileName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatSize(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 hover:bg-muted rounded-lg shrink-0"
                        >
                          <Eye size={14} className="text-muted-foreground" />
                        </button>
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
            </div>

            {/* Income Entries - Collapsed by default */}
            {incomeTransactions.length > 0 && (
              <Collapsible open={incomeOpen} onOpenChange={setIncomeOpen}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between py-2.5 px-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <ChevronDown size={14} className={cn("text-muted-foreground transition-transform duration-200", incomeOpen && "rotate-180")} />
                      <ArrowDown size={14} className="text-green-500" />
                      <span className="text-sm font-semibold">Income Entries ({incomeTransactions.length})</span>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(totalIncome)}
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-1.5 mt-2">
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
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Expense Entries - Collapsed by default */}
            {expenseTransactions.length > 0 && (
              <Collapsible open={expenseOpen} onOpenChange={setExpenseOpen}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between py-2.5 px-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <ChevronDown size={14} className={cn("text-muted-foreground transition-transform duration-200", expenseOpen && "rotate-180")} />
                      <ArrowUp size={14} className="text-red-500" />
                      <span className="text-sm font-semibold">Expense Entries ({expenseTransactions.length})</span>
                    </div>
                    <span className="text-sm font-bold text-destructive">
                      {formatCurrency(totalExpense)}
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-1.5 mt-2">
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
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Vendor Payments - Collapsed by default */}
            {vendorBreakdown.length > 0 && (
              <Collapsible open={vendorsOpen} onOpenChange={setVendorsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between py-2.5 px-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <ChevronDown size={14} className={cn("text-muted-foreground transition-transform duration-200", vendorsOpen && "rotate-180")} />
                      <Store size={14} className="text-muted-foreground" />
                      <span className="text-sm font-semibold">Vendor Payments ({vendorBreakdown.length})</span>
                    </div>
                    <span className="text-sm font-bold text-destructive">
                      {formatCurrency(totalVendorSpend)}
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-1.5 mt-2">
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
                </CollapsibleContent>
              </Collapsible>
            )}

            {sortedTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt size={40} className="mx-auto mb-2 opacity-50" />
                <p>No transactions yet for this project</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Preview Overlay */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 safe-top">
            <button
              onClick={() => setPreviewDoc(null)}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="font-medium text-sm truncate flex-1">{previewDoc.fileName}</span>
            <a
              href={previewDoc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <ExternalLink size={18} className="text-muted-foreground" />
            </a>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            {previewDoc.fileType.startsWith('image/') ? (
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.fileName}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : previewDoc.fileType === 'application/pdf' ? (
              <iframe
                src={previewDoc.fileUrl}
                title={previewDoc.fileName}
                className="w-full h-full border-0 rounded-lg"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <File size={48} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">Preview not available</p>
                <p className="text-sm mt-1">This file type cannot be previewed in the app</p>
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
                >
                  <ExternalLink size={14} /> Open externally
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

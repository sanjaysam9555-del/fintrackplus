
# Search Enhancement and Transaction Detail View

## Overview

This plan implements two key improvements:
1. **Project-scoped search**: Add search to both the main Projects tab and the Project Detail sheet, with the detail sheet search limited to transactions within that specific project
2. **Full detail view on search results**: When clicking any transaction from search results, display a complete detail sheet showing all transaction information

---

## Technical Implementation

### Part 1: Add Search to Project Views

#### File: `src/components/ProjectOverviewPage.tsx`

The Projects tab already has a search button in the header (line 105-111) that triggers `onSearchClick`, which opens the global search. This is working correctly.

**No changes needed** - the main Projects tab already opens the global search dialog.

---

#### File: `src/components/ProjectDetailSheet.tsx`

Add a search button to the Project Detail header that opens a project-scoped search dialog.

**Changes:**
1. Add a search button next to the close button in the drawer header
2. Add state for showing a project-scoped search
3. Create inline search functionality that filters only transactions within this project

```tsx
// New state
const [searchQuery, setSearchQuery] = useState("");
const [isSearching, setIsSearching] = useState(false);

// Filter transactions based on search
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
```

**Header modification** - add search icon button and inline search input:
```tsx
<DrawerHeader>
  <div className="flex items-center gap-3">
    {/* ... existing icon and title ... */}
    <button
      onClick={() => setIsSearching(!isSearching)}
      className="p-2 rounded-full hover:bg-muted transition-colors"
    >
      <Search size={18} className="text-muted-foreground" />
    </button>
    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
      <X size={20} />
    </button>
  </div>
  
  {/* Inline search bar when active */}
  {isSearching && (
    <div className="mt-3 flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
      <Search size={16} className="text-muted-foreground" />
      <input
        autoFocus
        placeholder="Search in this project..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 bg-transparent outline-none text-sm"
      />
      {searchQuery && (
        <button onClick={() => setSearchQuery("")}>
          <X size={16} className="text-muted-foreground" />
        </button>
      )}
    </div>
  )}
</DrawerHeader>
```

**Content modification** - show search results when searching:
```tsx
{searchQuery.trim() ? (
  // Show search results
  <div className="space-y-1.5">
    <p className="text-xs text-muted-foreground mb-2">
      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} in this project
    </p>
    {searchResults.length > 0 ? (
      searchResults.map(transaction => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          category={getCategoryById(transaction.categoryId)}
          userId={userId}
          onEditSheetChange={onEditSheetChange}
          compact
        />
      ))
    ) : (
      <div className="text-center py-8 text-muted-foreground">
        <Search size={32} className="mx-auto mb-2 opacity-50" />
        <p>No matching transactions</p>
      </div>
    )}
  </div>
) : (
  // Show normal content (existing code)
)}
```

---

### Part 2: Transaction Detail View from Search Results

#### File: `src/components/TransactionDetailSheet.tsx` (NEW FILE)

Create a dedicated sheet component that shows complete transaction details in a read-only format, with options to edit or delete.

```tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Trash2, CreditCard, Banknote, Calendar, Tag, FolderKanban, Store, StickyNote, Paperclip, Receipt, Users } from "lucide-react";
import { Transaction, Category, Project, Partner } from "@/lib/types";
import { formatCurrency, formatTime, formatDate } from "@/lib/constants";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "./CategoryIcon";
import { EditTransactionSheet } from "./EditTransactionSheet";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const TransactionDetailSheet = ({
  transaction,
  isOpen,
  onClose,
  userId,
}: TransactionDetailSheetProps) => {
  const { categories, projects, partners, deleteTransaction, addTransaction } = useFinanceStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!transaction) return null;

  const category = categories.find(c => c.id === transaction.categoryId);
  const project = projects.find(p => p.id === transaction.projectId);
  const partner = partners.find(p => p.id === transaction.partnerId);
  const isExpense = transaction.type === 'expense';

  const handleDelete = () => {
    const deletedTransaction = { ...transaction };
    deleteTransaction(transaction.id, userId);
    onClose();
    toast(`${deletedTransaction.title || deletedTransaction.vendor} deleted`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          addTransaction({ ...deletedTransaction }, userId);
          toast.success('Transaction restored');
        },
      },
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[70] backdrop-blur-sm"
              onClick={onClose}
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-3xl max-h-[85vh] overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3">
                <div className="w-10 h-1 bg-muted rounded-full" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <CategoryIcon 
                    iconName={category?.icon || 'Receipt'} 
                    colorClass={category?.color || 'category-other'}
                    size="md"
                  />
                  <div>
                    <h2 className="text-lg font-bold">
                      {transaction.title || transaction.vendor || 'Transaction'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)} at {formatTime(transaction.time)}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                  <X size={20} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-180px)]">
                {/* Amount Card */}
                <div className={cn(
                  "rounded-2xl p-6 text-center",
                  isExpense ? "bg-red-500/10" : "bg-green-500/10"
                )}>
                  <p className="text-sm text-muted-foreground mb-1">
                    {isExpense ? 'Expense' : 'Income'}
                  </p>
                  <p className={cn(
                    "text-3xl font-bold",
                    isExpense ? "text-red-500" : "text-green-500"
                  )}>
                    {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </p>
                  {transaction.isGst && (
                    <Badge className="mt-2 bg-amber-500/20 text-amber-600 border-amber-500/30">
                      GST Included
                    </Badge>
                  )}
                </div>
                
                {/* Details Grid */}
                <div className="space-y-3">
                  {/* Category */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <Tag size={18} className="text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium">{category?.name || 'Uncategorized'}</p>
                    </div>
                  </div>
                  
                  {/* Vendor */}
                  {transaction.vendor && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <Store size={18} className="text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">
                          {isExpense ? 'Vendor' : 'Source'}
                        </p>
                        <p className="font-medium">{transaction.vendor}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Payment Method */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    {transaction.paymentMethod === 'cash' ? (
                      <Banknote size={18} className="text-muted-foreground" />
                    ) : (
                      <CreditCard size={18} className="text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Payment Method</p>
                      <p className="font-medium">
                        {transaction.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Project */}
                  {project && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <FolderKanban size={18} className="text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Project</p>
                        <p className="font-medium" style={{ color: project.color }}>
                          {project.name}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Partner */}
                  {partner && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <Users size={18} className="text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Handled By</p>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: partner.color }}
                          >
                            {partner.name.charAt(0)}
                          </div>
                          <p className="font-medium">{partner.name}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Receipt */}
                  {transaction.receiptUrl && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <Paperclip size={18} className="text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Receipt</p>
                        <a 
                          href={transaction.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          View Receipt
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Notes */}
                  {transaction.notes && (
                    <div className="p-3 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <StickyNote size={18} className="text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Notes</p>
                      </div>
                      <p className="text-sm">{transaction.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="p-4 border-t border-border flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil size={16} className="mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Edit Sheet */}
      {transaction && (
        <EditTransactionSheet
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          transaction={transaction}
          userId={userId}
        />
      )}
      
      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </>
  );
};
```

---

#### File: `src/components/GlobalSearchDialog.tsx`

Update to show TransactionDetailSheet when clicking a transaction result.

**Changes:**
1. Add state for selected transaction detail view
2. Import TransactionDetailSheet
3. When clicking a transaction, store it and show the detail sheet instead of closing

```tsx
// Add import
import { TransactionDetailSheet } from './TransactionDetailSheet';
import { Transaction } from '@/lib/types';

// Add state inside component
const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

// Modify handleResultClick
const handleResultClick = useCallback((result: SearchResult) => {
  lightTap();
  if (result.type === 'transaction') {
    setSelectedTransaction(result.data as Transaction);
    // Don't close the search dialog yet - keep it open behind the detail sheet
  } else if (onNavigate) {
    if (result.type === 'category') {
      onNavigate('categories');
    } else if (result.type === 'project') {
      onNavigate('projects');
    } else if (result.type === 'vendor') {
      onNavigate('vendors');
    }
    onClose();
  }
}, [lightTap, onNavigate, onClose]);

// Handle closing the transaction detail sheet
const handleCloseTransactionDetail = useCallback(() => {
  setSelectedTransaction(null);
  onClose();
}, [onClose]);

// Add TransactionDetailSheet at the end of the component return
<TransactionDetailSheet
  transaction={selectedTransaction}
  isOpen={!!selectedTransaction}
  onClose={handleCloseTransactionDetail}
  userId={userId}  // Need to add userId prop
/>
```

**Props update:**
Add `userId` prop to GlobalSearchDialogProps and pass it through from Index.tsx.

---

#### File: `src/pages/Index.tsx`

Pass userId to GlobalSearchDialog:

```tsx
<GlobalSearchDialog
  isOpen={isSearchOpen}
  onClose={() => setIsSearchOpen(false)}
  onNavigate={handleNavigate}
  userId={user?.id}  // Add this prop
/>
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/TransactionDetailSheet.tsx` | CREATE | New component for displaying full transaction details |
| `src/components/ProjectDetailSheet.tsx` | MODIFY | Add inline project-scoped search functionality |
| `src/components/GlobalSearchDialog.tsx` | MODIFY | Integrate TransactionDetailSheet for transaction results |
| `src/pages/Index.tsx` | MODIFY | Pass userId to GlobalSearchDialog |

---

## User Experience Flow

### Search in Main Projects Tab
1. User taps search icon in Projects header
2. Global search dialog opens
3. User can search all transactions, categories, vendors, projects
4. Clicking a transaction opens the full detail sheet

### Search in Project Detail Sheet
1. User opens a project's detail view
2. User taps search icon in the drawer header
3. Inline search bar appears at the top
4. Search results show only transactions within this project
5. Clicking a result expands that transaction's details

### Transaction Detail from Search
1. User searches for any transaction (from any search entry point)
2. Clicks on a transaction result
3. Full detail sheet slides up showing:
   - Amount with expense/income styling
   - Category, vendor, payment method
   - Project assignment (if any)
   - Partner (if any)
   - Receipt link (if attached)
   - Notes (if any)
4. User can Edit or Delete directly from this view

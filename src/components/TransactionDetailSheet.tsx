import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Trash2, CreditCard, Banknote, Tag, FolderKanban, Store, StickyNote, Paperclip, Users, RefreshCw, Share2 } from "lucide-react";
import { Transaction } from "@/lib/types";
import { formatCurrency, formatTime, formatDate } from "@/lib/constants";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "./CategoryIcon";
import { EditTransactionSheet } from "./EditTransactionSheet";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { shareTransaction } from "@/lib/shareTransaction";

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
    // Capture linked transfer before deletion
    const allTransactions = useFinanceStore.getState().transactions;
    const linkedTxn = (deletedTransaction.vendor === 'Partner Transfer' && deletedTransaction.linkedTransactionId)
      ? allTransactions.find(t => t.id === deletedTransaction.linkedTransactionId)
      : undefined;
    const deletedLinked = linkedTxn ? { ...linkedTxn } : undefined;
    
    deleteTransaction(transaction.id, userId);
    onClose();
    
    const isTransfer = deletedTransaction.vendor === 'Partner Transfer' && deletedLinked;
    
    toast(`${deletedTransaction.title || deletedTransaction.vendor} deleted${isTransfer ? ' (both sides)' : ''}`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          addTransaction({ ...deletedTransaction }, userId, deletedTransaction.id);
          if (deletedLinked) {
            addTransaction({ ...deletedLinked }, userId, deletedLinked.id);
          }
          toast.success('Transaction restored');
        },
      },
    });
  };

  const handleEditClose = () => {
    setIsEditing(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !isEditing && (
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
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CategoryIcon 
                    iconName={category?.icon || 'Receipt'} 
                    colorClass={category?.color || 'category-other'}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold truncate">
                      {transaction.title || transaction.vendor || 'Transaction'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)} at {formatTime(transaction.time)}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-muted shrink-0">
                  <X size={20} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-180px)]">
                {/* Amount Card */}
                <div className={cn(
                  "rounded-2xl p-6 text-center",
                  isExpense ? "bg-destructive/10" : "bg-success/10"
                )}>
                  <p className="text-sm text-muted-foreground mb-1">
                    {isExpense ? 'Expense' : 'Income'}
                  </p>
                  <p className={cn(
                    "text-3xl font-bold",
                    isExpense ? "text-destructive" : "text-success"
                  )}>
                    {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </p>
                  {transaction.isGst && (
                    <Badge className="mt-2 bg-amber-500/20 text-amber-600 border-amber-500/30">
                      GST Included
                    </Badge>
                  )}
                  {transaction.isRecurring && (
                    <Badge className="mt-2 ml-2 bg-primary/20 text-primary border-primary/30">
                      <RefreshCw size={12} className="mr-1" />
                      {transaction.recurringFrequency}
                    </Badge>
                  )}
                </div>
                
                {/* Details Grid */}
                <div className="space-y-3">
                  {/* Category */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <Tag size={18} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium truncate">{category?.name || 'Uncategorized'}</p>
                    </div>
                  </div>
                  
                  {/* Vendor */}
                  {transaction.vendor && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <Store size={18} className="text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {isExpense ? 'Vendor' : 'Source'}
                        </p>
                        <p className="font-medium truncate">{transaction.vendor}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Payment Method */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    {transaction.paymentMethod === 'cash' ? (
                      <Banknote size={18} className="text-muted-foreground shrink-0" />
                    ) : (
                      <CreditCard size={18} className="text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Payment Method</p>
                      <p className="font-medium">
                        {transaction.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Project */}
                  {project && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <FolderKanban size={18} className="text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Project</p>
                        <p className="font-medium truncate" style={{ color: project.color }}>
                          {project.name}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Partner */}
                  {partner && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <Users size={18} className="text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Handled By</p>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: partner.color }}
                          >
                            {partner.name.charAt(0)}
                          </div>
                          <p className="font-medium truncate">{partner.name}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Receipt */}
                  {transaction.receiptUrl && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <Paperclip size={18} className="text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
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
                  variant="outline"
                  className="flex-1"
                  onClick={() => shareTransaction({
                    transaction,
                    categoryName: category?.name,
                    projectName: project?.name,
                    projectColor: project?.color,
                    vendorName: transaction.vendor,
                    partnerName: partner?.name,
                    partnerColor: partner?.color,
                  })}
                >
                  <Share2 size={16} className="mr-2" />
                  Share
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
          onClose={handleEditClose}
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

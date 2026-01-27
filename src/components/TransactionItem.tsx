import { useState, useCallback } from "react";
import { Transaction, Category } from "@/lib/types";
import { formatCurrency, formatTime, formatDate } from "@/lib/constants";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { ChevronDown, Pencil, Trash2, CreditCard, Banknote, Users, Paperclip, Receipt } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EditTransactionSheet } from "./EditTransactionSheet";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onClick?: () => void;
  userId?: string;
  onEditSheetChange?: (isOpen: boolean) => void;
}

export const TransactionItem = ({ transaction, category, userId, onEditSheetChange }: TransactionItemProps) => {
  const { deleteTransaction, addTransaction, projects, partners } = useFinanceStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const partner = partners.find(p => p.id === transaction.partnerId);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const x = useMotionValue(0);
  const controls = useAnimation();
  const background = useTransform(
    x,
    [-100, 0],
    ["hsl(var(--destructive))", "transparent"]
  );
  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  
  const isExpense = transaction.type === 'expense';
  const project = projects.find(p => p.id === transaction.projectId);
  
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = useCallback(() => {
    // Store the transaction data for potential undo
    const deletedTransaction = { ...transaction };
    
    // Delete the transaction
    deleteTransaction(transaction.id, userId);
    
    // Show undo toast
    toast(`${deletedTransaction.title || deletedTransaction.vendor} deleted`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          // Restore the transaction
          addTransaction({
            type: deletedTransaction.type,
            amount: deletedTransaction.amount,
            title: deletedTransaction.title,
            vendor: deletedTransaction.vendor,
            categoryId: deletedTransaction.categoryId,
            projectId: deletedTransaction.projectId,
            paymentMethod: deletedTransaction.paymentMethod,
            date: deletedTransaction.date,
            time: deletedTransaction.time,
            notes: deletedTransaction.notes,
            isRecurring: deletedTransaction.isRecurring,
            recurringFrequency: deletedTransaction.recurringFrequency,
          }, userId);
          toast.success('Transaction restored');
        },
      },
    });
  }, [transaction, deleteTransaction, addTransaction, userId]);
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    onEditSheetChange?.(true);
  };
  
  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      setShowDeleteConfirm(true);
    }
    // Always animate back to original position smoothly
    await controls.start({ x: 0 }, { type: "spring", stiffness: 500, damping: 30 });
  };
  
  return (
    <>
      <motion.div
        layout
        className="relative overflow-hidden rounded-xl"
      >
        {/* Delete Background */}
        <motion.div
          style={{ background }}
          className="absolute inset-0 flex items-center justify-end pr-6 rounded-xl"
        >
          <motion.div style={{ opacity: deleteOpacity }}>
            <Trash2 className="text-destructive-foreground" size={20} />
          </motion.div>
        </motion.div>
        
        {/* Main Card */}
        <motion.div
          style={{ x }}
          animate={controls}
          drag="x"
          dragConstraints={{ left: -100, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          className="bg-card rounded-xl shadow-md border border-border/50 overflow-hidden relative hover:shadow-lg transition-shadow will-change-transform"
        >
          {/* Main Row */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <div className="flex-shrink-0">
              <CategoryIcon 
                iconName={category?.icon || 'Circle'} 
                colorClass={category?.color || 'category-other'} 
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {transaction.title || transaction.vendor || category?.name || 'Transaction'}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {(() => {
                  const parts: string[] = [];
                  
                  // Add vendor if different from title
                  if (transaction.vendor && transaction.vendor !== (transaction.title || '')) {
                    parts.push(transaction.vendor);
                  }
                  
                  // Add category name
                  if (category?.name) {
                    parts.push(category.name);
                  }
                  
                  // Add project name if available
                  if (project?.name && parts.length < 2) {
                    parts.push(project.name);
                  }
                  
                  // Add payment method if we still need more info
                  if (parts.length < 2) {
                    parts.push(transaction.paymentMethod === 'cash' ? 'Cash' : 'Online');
                  }
                  
                  // Always add time
                  parts.push(formatTime(transaction.time));
                  
                  return parts.join(' • ');
                })()}
                {partner && (
                  <span 
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white ml-1"
                    style={{ backgroundColor: partner.color }}
                    title={partner.name}
                  >
                    {partner.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Receipt & GST indicators */}
              <div className="flex items-center gap-1">
                {transaction.receiptUrl && (
                  <span title="Receipt attached">
                    <Paperclip size={12} className="text-primary" />
                  </span>
                )}
                {transaction.isGst && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] h-4 bg-amber-500/10 text-amber-600 border-amber-500/30">
                    GST
                  </Badge>
                )}
              </div>
              <p className={cn(
                "font-bold text-right whitespace-nowrap",
                isExpense ? "text-destructive" : "text-success"
              )}>
                {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
              </p>
              <ChevronDown 
                size={16} 
                className={cn(
                  "text-muted-foreground transition-transform flex-shrink-0",
                  isExpanded && "rotate-180"
                )} 
              />
            </div>
          </div>
          
          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 pt-1 border-t border-border">
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{formatDate(transaction.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Payment:</span>
                        <span className="font-medium flex items-center gap-1">
                          {transaction.paymentMethod === 'cash' ? (
                            <><Banknote size={12} /> Cash</>
                          ) : (
                            <><CreditCard size={12} /> Online</>
                          )}
                        </span>
                      </div>
                      {partner && (
                        <div className="flex items-center gap-2 col-span-2">
                          <span className="text-muted-foreground">Handled by:</span>
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                              style={{ backgroundColor: partner.color }}
                            >
                              {partner.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{partner.name}</span>
                          </div>
                        </div>
                      )}
                      {project && (
                        <div className="flex items-center gap-2 col-span-2">
                          <span className="text-muted-foreground">Project:</span>
                          <span className="font-medium text-primary">{project.name}</span>
                        </div>
                      )}
                      {transaction.notes && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Notes: </span>
                          <span className="text-foreground">{transaction.notes}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEdit}
                        className="flex-1 h-8"
                      >
                        <Pencil size={12} className="mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        className="flex-1 h-8"
                      >
                        <Trash2 size={12} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
      />
      
      <EditTransactionSheet
        isOpen={isEditing}
        onClose={() => {
          setIsEditing(false);
          onEditSheetChange?.(false);
        }}
        transaction={transaction}
        userId={userId}
      />
    </>
  );
};

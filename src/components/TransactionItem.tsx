import { useState, useCallback } from "react";
import { Transaction, Category } from "@/lib/types";
import { formatCurrency, formatTime, formatDate } from "@/lib/constants";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { ChevronDown, Pencil, Trash2, CreditCard, Banknote, Users, Paperclip, Receipt, Share2, Landmark, Calendar, Tag, Store, FolderKanban, StickyNote } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EditTransactionSheet } from "./EditTransactionSheet";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { shareTransaction } from "@/lib/shareTransaction";
import { findPartnerByHandledBy, isInternalTransferVendor } from "@/lib/partnerIdentity";

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onClick?: () => void;
  userId?: string;
  onEditSheetChange?: (isOpen: boolean) => void;
  compact?: boolean;
}

const DetailRow = ({
  icon: Icon,
  label,
  value,
  valueClassName,
  iconClassName,
  iconBgClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  iconClassName?: string;
  iconBgClassName?: string;
}) => (
  <div className="flex items-center gap-3 py-2">
    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", iconBgClassName || "bg-muted")}>
      <Icon size={13} className={iconClassName || "text-muted-foreground"} />
    </div>
    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-sm font-medium text-right truncate", valueClassName)}>{value}</span>
    </div>
  </div>
);

export const TransactionItem = ({ transaction, category, userId, onEditSheetChange, compact = false }: TransactionItemProps) => {
  const { deleteTransaction, addTransaction, projects, partners, orgName, orgLogoUrl } = useFinanceStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const partner = findPartnerByHandledBy(partners, transaction.handledBy);
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
    const deletedTransaction = { ...transaction };
    // Capture linked transfer before deletion
    const { transactions } = useFinanceStore.getState();
    const linkedTxn = (isInternalTransferVendor(deletedTransaction.vendor) && deletedTransaction.linkedTransactionId)
      ? transactions.find(t => t.id === deletedTransaction.linkedTransactionId)
      : undefined;
    const deletedLinked = linkedTxn ? { ...linkedTxn } : undefined;
    
    deleteTransaction(transaction.id, userId);
    
    const isTransfer = isInternalTransferVendor(deletedTransaction.vendor) && deletedLinked;
    
    toast(`${deletedTransaction.title || deletedTransaction.vendor} deleted${isTransfer ? ' (both sides)' : ''}`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          addTransaction({
            type: deletedTransaction.type,
            amount: deletedTransaction.amount,
            title: deletedTransaction.title,
            vendor: deletedTransaction.vendor,
            categoryId: deletedTransaction.categoryId,
            projectId: deletedTransaction.projectId,
            handledBy: deletedTransaction.handledBy,
            paymentMethod: deletedTransaction.paymentMethod,
            date: deletedTransaction.date,
            time: deletedTransaction.time,
            notes: deletedTransaction.notes,
            isRecurring: deletedTransaction.isRecurring,
            recurringFrequency: deletedTransaction.recurringFrequency,
            receiptUrl: deletedTransaction.receiptUrl,
            isGst: deletedTransaction.isGst,
            isPartPayment: deletedTransaction.isPartPayment,
            totalExpectedAmount: deletedTransaction.totalExpectedAmount,
            linkedTransactionId: deletedTransaction.linkedTransactionId,
            plannedInstallments: deletedTransaction.plannedInstallments,
          }, userId, deletedTransaction.id);
          
          // Restore linked transfer counterpart
          if (deletedLinked) {
            addTransaction({
              type: deletedLinked.type,
              amount: deletedLinked.amount,
              title: deletedLinked.title,
              vendor: deletedLinked.vendor,
              categoryId: deletedLinked.categoryId,
              projectId: deletedLinked.projectId,
              handledBy: deletedLinked.handledBy,
              paymentMethod: deletedLinked.paymentMethod,
              date: deletedLinked.date,
              time: deletedLinked.time,
              notes: deletedLinked.notes,
              linkedTransactionId: deletedLinked.linkedTransactionId,
            }, userId, deletedLinked.id);
          }
          
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
    await controls.start({ x: 0 }, { type: "spring", stiffness: 500, damping: 30 });
  };

  const PartnerBadge = () => {
    if (!partner) return null;

    if (partner.isCompanyAccount) {
      return (
        <span
          className="absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary ring-1 ring-card"
          title={partner.name}
        >
          <Landmark size={9} />
        </span>
      );
    }
    
    if (partner.avatarUrl) {
      return (
        <img
          src={partner.avatarUrl}
          alt={partner.name}
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full object-cover ring-1 ring-card"
          title={partner.name}
        />
      );
    }
    
    return (
      <span 
        className="absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold text-white ring-1 ring-card"
        style={{ backgroundColor: partner.color }}
        title={partner.name}
      >
        {partner.name.charAt(0).toUpperCase()}
      </span>
    );
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
            className={cn(
              "flex items-center cursor-pointer hover:bg-muted/30 transition-colors",
              compact ? "gap-2 p-2" : "gap-2.5 p-3"
            )}
          >
            <div className="relative flex-shrink-0">
              <CategoryIcon 
                iconName={category?.icon || 'Circle'} 
                colorClass={category?.color || 'category-other'}
                size={compact ? "sm" : "md"}
              />
              <PartnerBadge />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={cn(
                  "text-foreground truncate",
                  compact ? "text-sm font-medium" : "text-sm font-semibold lg:text-base"
                )}>
                  {transaction.title || transaction.vendor || category?.name || 'Transaction'}
                </p>
                {transaction.receiptUrl && (
                  <span title="Receipt attached" className="shrink-0">
                    <Paperclip size={12} className="text-primary" />
                  </span>
                )}
                {transaction.isGst && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] h-4 bg-amber-500/10 text-amber-600 border-amber-500/30 shrink-0">
                    GST
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 min-w-0 mt-0.5">
                <p className={cn(
                  "text-muted-foreground truncate",
                  compact ? "text-xs" : "text-xs lg:text-sm"
                )}>
                  {(() => {
                    const parts: string[] = [];

                    if (transaction.vendor && transaction.vendor !== (transaction.title || '')) {
                      parts.push(transaction.vendor);
                    }

                    if (category?.name) {
                      parts.push(category.name);
                    }

                    if (parts.length === 0 && project?.name) {
                      parts.push(project.name);
                    }

                    if (parts.length === 0) {
                      parts.push(transaction.paymentMethod === 'cash' ? 'Cash' : 'Online');
                    }

                    return parts.join(' • ');
                  })()}
                </p>
                {transaction.paymentMethod === 'cash' ? (
                  <Banknote size={11} className="text-cash shrink-0" />
                ) : (
                  <CreditCard size={11} className="text-online shrink-0" />
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <p className={cn(
                "font-bold text-right whitespace-nowrap",
                compact ? "text-sm" : "text-base lg:text-lg",
                isExpense ? "text-destructive" : "text-success"
              )}>
                {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
              </p>
              <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                {formatTime(transaction.time)}, {formatDate(transaction.date)}
              </p>
            </div>
            <ChevronDown
              size={compact ? 14 : 16}
              className={cn(
                "text-muted-foreground transition-transform flex-shrink-0",
                isExpanded && "rotate-180"
              )}
            />
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
                <div className="px-3 pb-3 pt-2 border-t border-border bg-muted/20">
                  <div className="divide-y divide-border/60">
                    <DetailRow icon={Calendar} label="Date" value={formatDate(transaction.date)} />
                    <DetailRow
                      icon={transaction.paymentMethod === 'cash' ? Banknote : CreditCard}
                      label="Payment"
                      value={transaction.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                      iconClassName={transaction.paymentMethod === 'cash' ? "text-cash" : "text-online"}
                      iconBgClassName={transaction.paymentMethod === 'cash' ? "bg-cash/10" : "bg-online/10"}
                    />
                    {category?.name && (
                      <DetailRow icon={Tag} label="Category" value={category.name} />
                    )}
                    {transaction.vendor && transaction.vendor !== transaction.title && (
                      <DetailRow icon={Store} label="Vendor" value={transaction.vendor} />
                    )}
                    {partner && (
                      <DetailRow
                        icon={Users}
                        label="Handled by"
                        value={
                          <span className="inline-flex items-center gap-1.5">
                            {partner.avatarUrl ? (
                              <img src={partner.avatarUrl} alt={partner.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                            ) : (
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                                style={{ backgroundColor: partner.color }}
                              >
                                {partner.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                            {partner.name}
                          </span>
                        }
                      />
                    )}
                    {project && (
                      <DetailRow icon={FolderKanban} label="Project" value={project.name} valueClassName="text-primary" />
                    )}
                  </div>

                  {transaction.notes && (
                    <div className="flex items-start gap-3 mt-2 pt-2 border-t border-border/60">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <StickyNote size={13} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Notes</p>
                        <p className="text-sm text-foreground">{transaction.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEdit}
                      className="flex-1 h-9 rounded-lg"
                    >
                      <Pencil size={12} className="mr-1.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareTransaction({
                          transaction,
                          categoryName: category?.name,
                          projectName: project?.name,
                          projectColor: project?.color,
                          vendorName: transaction.vendor,
                          partnerName: partner?.name,
                          partnerColor: partner?.color,
                          orgName,
                          orgLogoUrl,
                        });
                      }}
                      className="flex-1 h-9 rounded-lg"
                    >
                      <Share2 size={12} className="mr-1.5" /> Share
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="flex-1 h-9 rounded-lg"
                    >
                      <Trash2 size={12} className="mr-1.5" /> Delete
                    </Button>
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

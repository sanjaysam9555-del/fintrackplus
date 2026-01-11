import { useState } from "react";
import { Transaction, Category } from "@/lib/types";
import { formatCurrency, formatTime, formatDate } from "@/lib/constants";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Pencil, Trash2, X, Check, CreditCard, Banknote } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onClick?: () => void;
}

export const TransactionItem = ({ transaction, category }: TransactionItemProps) => {
  const { deleteTransaction, updateTransaction, projects } = useFinanceStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(transaction.amount.toString());
  const [editVendor, setEditVendor] = useState(transaction.vendor);
  const [editNotes, setEditNotes] = useState(transaction.notes || "");
  
  const isExpense = transaction.type === 'expense';
  const project = projects.find(p => p.id === transaction.projectId);
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTransaction(transaction.id);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTransaction(transaction.id, {
      amount: parseFloat(editAmount),
      vendor: editVendor,
      notes: editNotes || undefined,
    });
    setIsEditing(false);
  };
  
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditAmount(transaction.amount.toString());
    setEditVendor(transaction.vendor);
    setEditNotes(transaction.notes || "");
    setIsEditing(false);
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card rounded-xl shadow-card border border-border overflow-hidden"
    >
      {/* Main Row */}
      <div
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <CategoryIcon 
          iconName={category?.icon || 'Circle'} 
          colorClass={category?.color || 'category-other'} 
        />
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {transaction.vendor}
          </p>
          <p className="text-sm text-muted-foreground">
            {category?.name || 'Other'} • {formatTime(transaction.time)}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <p className={cn(
            "font-bold text-right",
            isExpense ? "text-destructive" : "text-success"
          )}>
            {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
          </p>
          <ChevronDown 
            size={16} 
            className={cn(
              "text-muted-foreground transition-transform",
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
              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Amount</label>
                      <Input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Vendor</label>
                      <Input
                        value={editVendor}
                        onChange={(e) => setEditVendor(e.target.value)}
                        className="h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Notes</label>
                    <Input
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add notes..."
                      className="h-8 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} className="flex-1 h-8">
                      <Check size={14} className="mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1 h-8">
                      <X size={14} className="mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
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
                  
                  {/* Action Buttons */}
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
                      onClick={handleDelete}
                      className="flex-1 h-8"
                    >
                      <Trash2 size={12} className="mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

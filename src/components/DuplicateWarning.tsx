import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PotentialDuplicate {
  transaction: Transaction;
  similarity: number;
  reasons: string[];
}

interface DuplicateWarningProps {
  duplicates: PotentialDuplicate[];
  onDismiss: () => void;
  onProceed: () => void;
}

export const DuplicateWarning = ({ duplicates, onDismiss, onProceed }: DuplicateWarningProps) => {
  if (duplicates.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-warning/20 rounded-lg shrink-0">
            <AlertTriangle size={16} className="text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">
              Potential duplicate detected
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This looks similar to existing transactions:
            </p>
            
            <div className="mt-3 space-y-2">
              {duplicates.map((dup) => (
                <div 
                  key={dup.transaction.id}
                  className="bg-card/50 rounded-lg p-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">
                      {dup.transaction.title || dup.transaction.vendor}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {dup.similarity}% match
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(dup.transaction.amount)} • {formatDate(dup.transaction.date)}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dup.reasons.map((reason, i) => (
                      <span 
                        key={i}
                        className="px-1.5 py-0.5 bg-warning/10 text-warning text-[10px] rounded"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={onDismiss}
                className="flex-1 h-8"
              >
                <X size={12} className="mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onProceed}
                className="flex-1 h-8"
              >
                <Check size={12} className="mr-1" />
                Add Anyway
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

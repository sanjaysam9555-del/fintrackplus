import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Tag, FolderKanban, Store, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { CategoryIcon } from './CategoryIcon';
import { TransactionDetailSheet } from './TransactionDetailSheet';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { Transaction } from '@/lib/types';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTransaction?: (id: string) => void;
  onNavigate?: (section: string) => void;
  userId?: string;
}

export const GlobalSearchDialog = ({ 
  isOpen, 
  onClose, 
  onSelectTransaction,
  onNavigate,
  userId 
}: GlobalSearchDialogProps) => {
  const { query, setQuery, results, clearSearch } = useGlobalSearch();
  const { lightTap } = useHaptics();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Clear search when closing
  useEffect(() => {
    if (!isOpen) {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  const handleResultClick = useCallback((result: SearchResult) => {
    lightTap();
    if (result.type === 'transaction') {
      // Show the transaction detail sheet
      setSelectedTransaction(result.data as Transaction);
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

  const handleCloseTransactionDetail = useCallback(() => {
    setSelectedTransaction(null);
    onClose();
  }, [onClose]);

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'transaction': return Receipt;
      case 'category': return Tag;
      case 'project': return FolderKanban;
      case 'vendor': return Store;
    }
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
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Dialog Container - Centers relative to content area on desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 md:left-[72px] z-50 flex items-start justify-center pt-[12vh] pointer-events-none"
          >
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="w-[calc(100%-2rem)] max-w-[520px] pointer-events-auto bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-black/10 ring-1 ring-white/10 dark:ring-white/5 overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-5 border-b border-border/50 bg-muted/30">
                <Search size={22} className="text-primary shrink-0" />
                <Input
                  autoFocus
                  placeholder="Search everything..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0 text-lg placeholder:text-muted-foreground/60"
                />
                {query && (
                  <button
                    onClick={clearSearch}
                    className="p-1.5 rounded-full hover:bg-muted transition-colors"
                  >
                    <X size={18} className="text-muted-foreground" />
                  </button>
                )}
              </div>
              
              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto">
                {results.length > 0 ? (
                  <div className="p-2">
                    {results.map((result) => {
                      const TypeIcon = getTypeIcon(result.type);
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/80 transition-colors text-left group"
                        >
                          <div className="shrink-0">
                            {result.icon ? (
                              <CategoryIcon 
                                iconName={result.icon} 
                                colorClass={result.color || 'category-other'} 
                                size="sm"
                              />
                            ) : (
                              <div 
                                className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted"
                                style={{ backgroundColor: result.color ? `${result.color}20` : undefined }}
                              >
                                <TypeIcon size={18} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-muted rounded-full">
                              {result.type}
                            </span>
                            <ArrowRight size={14} className="text-muted-foreground" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : query ? (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Search size={24} className="text-muted-foreground" />
                    </div>
                    <p className="font-medium">No results found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Search size={24} className="text-muted-foreground" />
                    </div>
                    <p className="font-medium">Quick Search</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Find transactions, vendors, projects, and more
                    </p>
                  </div>
                )}
              </div>
              
              {/* Keyboard hints */}
              <div className="p-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px]">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px]">ESC</kbd>
                  <span>Close</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    
    {/* Transaction Detail Sheet */}
    <TransactionDetailSheet
      transaction={selectedTransaction}
      isOpen={!!selectedTransaction}
      onClose={handleCloseTransactionDetail}
      userId={userId}
    />
  </>
  );
};

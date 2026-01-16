import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Tag, FolderKanban, Store, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { CategoryIcon } from './CategoryIcon';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTransaction?: (id: string) => void;
  onNavigate?: (section: string) => void;
}

export const GlobalSearchDialog = ({ 
  isOpen, 
  onClose, 
  onSelectTransaction,
  onNavigate 
}: GlobalSearchDialogProps) => {
  const { query, setQuery, results, clearSearch } = useGlobalSearch();
  const { lightTap } = useHaptics();

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
    if (result.type === 'transaction' && onSelectTransaction) {
      onSelectTransaction(result.id);
    } else if (onNavigate) {
      if (result.type === 'category') {
        onNavigate('categories');
      } else if (result.type === 'project') {
        onNavigate('projects');
      } else if (result.type === 'vendor') {
        onNavigate('vendors');
      }
    }
    onClose();
  }, [lightTap, onSelectTransaction, onNavigate, onClose]);

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'transaction': return Receipt;
      case 'category': return Tag;
      case 'project': return FolderKanban;
      case 'vendor': return Store;
    }
  };

  return (
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
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[500px] z-50 bg-card rounded-2xl shadow-xl border border-border overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search size={20} className="text-muted-foreground shrink-0" />
              <Input
                autoFocus
                placeholder="Search transactions, categories, projects..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0 text-base"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="p-1 rounded-full hover:bg-muted"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              )}
            </div>
            
            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {results.length > 0 ? (
                <div className="p-2">
                  {results.map((result) => {
                    const TypeIcon = getTypeIcon(result.type);
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
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
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: result.color ? `${result.color}20` : undefined }}
                            >
                              <TypeIcon size={16} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          <span className="text-xs text-muted-foreground capitalize">
                            {result.type}
                          </span>
                          <ArrowRight size={14} className="text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : query ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No results found for "{query}"</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <p>Start typing to search</p>
                  <p className="text-sm mt-1">
                    Search by vendor, amount, date, notes, or category
                  </p>
                </div>
              )}
            </div>
            
            {/* Keyboard hint */}
            <div className="p-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">ESC</kbd> to close
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

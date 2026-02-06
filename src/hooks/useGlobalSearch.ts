import { useState, useMemo, useCallback } from 'react';
import { useFinanceStore } from '@/lib/store';
import { Transaction, Category, Project, Vendor } from '@/lib/types';
import { formatCurrency } from '@/lib/constants';

export interface SearchResult {
  type: 'transaction' | 'category' | 'project' | 'vendor';
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  color?: string;
  data: Transaction | Category | Project | Vendor;
}

/**
 * Hook for global search across all transactions, categories, projects, and vendors
 */
export const useGlobalSearch = () => {
  const [query, setQuery] = useState('');
  const { transactions, categories, projects, vendors } = useFinanceStore();

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search transactions - check each field individually for better matching
    transactions.forEach(t => {
      const category = categories.find(c => c.id === t.categoryId);
      const project = projects.find(p => p.id === t.projectId);
      
      // Check each field individually for partial matches
      const fieldsToSearch = [
        t.vendor?.toLowerCase() || '',
        t.title?.toLowerCase() || '',
        t.notes?.toLowerCase() || '',
        category?.name?.toLowerCase() || '',
        project?.name?.toLowerCase() || '',
        t.amount.toString(), // Raw amount: "50000"
        formatCurrency(t.amount).toLowerCase(), // Formatted: "₹50,000"
        t.date,
        t.paymentMethod?.toLowerCase() || '',
      ];

      const isMatch = fieldsToSearch.some(field => field.includes(searchTerm));

      if (isMatch) {
        results.push({
          type: 'transaction',
          id: t.id,
          title: t.title || t.vendor,
          subtitle: `${formatCurrency(t.amount)} • ${t.date}`,
          icon: category?.icon,
          color: category?.color,
          data: t,
        });
      }
    });

    // Search categories
    categories.forEach(c => {
      if (c.name.toLowerCase().includes(searchTerm)) {
        const count = transactions.filter(t => t.categoryId === c.id).length;
        results.push({
          type: 'category',
          id: c.id,
          title: c.name,
          subtitle: `${count} transactions`,
          icon: c.icon,
          color: c.color,
          data: c,
        });
      }
    });

    // Search projects
    projects.forEach(p => {
      if (p.name.toLowerCase().includes(searchTerm) || 
          p.description?.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'project',
          id: p.id,
          title: p.name,
          subtitle: p.description || 'No description',
          color: p.color,
          data: p,
        });
      }
    });

    // Search vendors
    vendors.forEach(v => {
      if (v.name.toLowerCase().includes(searchTerm)) {
        const count = transactions.filter(t => 
          t.vendor.toLowerCase() === v.name.toLowerCase()
        ).length;
        results.push({
          type: 'vendor',
          id: v.id,
          title: v.name,
          subtitle: `${count} transactions`,
          icon: v.icon,
          color: v.color,
          data: v,
        });
      }
    });

    return results.slice(0, 20); // Limit results
  }, [query, transactions, categories, projects, vendors]);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    results,
    clearSearch,
    hasResults: results.length > 0,
  };
};

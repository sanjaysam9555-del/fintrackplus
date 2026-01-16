import { useMemo, useCallback } from 'react';
import { useFinanceStore } from '@/lib/store';
import { Transaction } from '@/lib/types';

interface PotentialDuplicate {
  transaction: Transaction;
  similarity: number;
  reasons: string[];
}

/**
 * Hook for detecting potential duplicate transactions
 */
export const useDuplicateDetection = () => {
  const { transactions } = useFinanceStore();

  const checkForDuplicates = useCallback((
    vendor: string,
    amount: number,
    date: string
  ): PotentialDuplicate[] => {
    const duplicates: PotentialDuplicate[] = [];
    const vendorLower = vendor.toLowerCase().trim();

    transactions.forEach(t => {
      const reasons: string[] = [];
      let similarity = 0;

      // Check vendor match
      if (t.vendor.toLowerCase().trim() === vendorLower) {
        similarity += 40;
        reasons.push('Same vendor');
      } else if (t.vendor.toLowerCase().includes(vendorLower) || 
                 vendorLower.includes(t.vendor.toLowerCase())) {
        similarity += 20;
        reasons.push('Similar vendor');
      }

      // Check amount match
      if (t.amount === amount) {
        similarity += 35;
        reasons.push('Same amount');
      } else if (Math.abs(t.amount - amount) / amount < 0.1) {
        similarity += 15;
        reasons.push('Similar amount');
      }

      // Check date match
      if (t.date === date) {
        similarity += 25;
        reasons.push('Same date');
      } else {
        // Check if within 3 days
        const transDate = new Date(t.date);
        const inputDate = new Date(date);
        const daysDiff = Math.abs(
          (transDate.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 3) {
          similarity += 10;
          reasons.push('Within 3 days');
        }
      }

      // Only report if similarity is high enough
      if (similarity >= 50) {
        duplicates.push({
          transaction: t,
          similarity,
          reasons,
        });
      }
    });

    // Sort by similarity
    return duplicates.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  }, [transactions]);

  return {
    checkForDuplicates,
  };
};

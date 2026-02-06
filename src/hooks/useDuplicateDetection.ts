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

      // PREREQUISITE: Amount must match exactly OR within 5% - otherwise skip entirely
      const amountDiff = Math.abs(t.amount - amount);
      const amountPercent = amount > 0 ? amountDiff / amount : 1;
      
      if (t.amount !== amount && amountPercent >= 0.05) {
        // Amounts differ too much - not a duplicate
        return;
      }

      // Check vendor match
      const tVendorLower = t.vendor.toLowerCase().trim();
      if (tVendorLower === vendorLower) {
        similarity += 35;
        reasons.push('Same vendor');
      } else if (
        vendorLower.length >= 4 && tVendorLower.length >= 4 &&
        (tVendorLower.includes(vendorLower) || vendorLower.includes(tVendorLower))
      ) {
        // Only match if both vendors are at least 4 chars (avoid false positives)
        similarity += 10;
        reasons.push('Similar vendor');
      }

      // Check amount match (we already passed the prerequisite)
      if (t.amount === amount) {
        similarity += 40;
        reasons.push('Same amount');
      } else {
        // Within 5%
        similarity += 20;
        reasons.push('Similar amount');
      }

      // Check date match
      if (t.date === date) {
        similarity += 30;
        reasons.push('Same date');
      } else {
        // Check if within 3 days
        const transDate = new Date(t.date);
        const inputDate = new Date(date);
        const daysDiff = Math.abs(
          (transDate.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 3) {
          similarity += 5;
          reasons.push('Within 3 days');
        }
      }

      // Higher threshold to reduce false positives
      if (similarity >= 70) {
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

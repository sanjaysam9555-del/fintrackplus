

## Fix: Centralize Partner ID Resolution to Eliminate All Collision Bugs

### Problem
The company bank account and its owner share the same `userId`. Every place that resolves a partner from a `handledBy` value uses `p.userId === id || p.id === id`, which can match either record nondeterministically. Similarly, every place that computes the "identifier" for a partner uses `p.userId || p.id`, which produces the same value for both.

We have been patching individual files one at a time, but the same bug pattern exists in **12+ locations** across the codebase. A centralized fix is needed.

### Solution
Create two helper functions in `src/lib/types.ts` (or a new `src/lib/partnerUtils.ts`):

```text
getPartnerId(partner)
  → company account: partner.id
  → regular partner: partner.userId || partner.id

findPartnerByHandledBy(partners, handledBy)
  → First try exact match on partner.id
  → Then try match on partner.userId (but skip company accounts)
```

Then replace every inline occurrence across all files.

### Files to modify

| File | What changes |
|---|---|
| `src/lib/partnerUtils.ts` | **New file** — `getPartnerId()` and `findPartnerByHandledBy()` helpers |
| `src/components/AddTransactionSheet.tsx` | Use helpers for `selectedPartner` lookup (line 95), highlight check (lines 763, 782), and `setHandledBy` (line 754) |
| `src/components/EditTransactionSheet.tsx` | Use helpers for `selectedPartner` lookup (line 80), highlight check (lines 725, 744), and `setHandledBy` (line 717) |
| `src/components/PartnerTransferSheet.tsx` | Use helpers for `fromPartner`/`toPartner` lookups (lines 38-39) — already partially fixed but should use centralized helper |
| `src/components/TransactionItem.tsx` | Use `findPartnerByHandledBy` for partner lookup (line 29) |
| `src/components/TransactionDetailSheet.tsx` | Same partner lookup fix (line 42) |
| `src/components/UpcomingRecurringCard.tsx` | Same partner lookup fix (line 60) |
| `src/components/UpcomingRecurringBanner.tsx` | Same partner lookup fix (line 90) |
| `src/components/PartPaymentTracker.tsx` | Same partner lookup fix (line 74) |
| `src/components/settings/ReportsSection.tsx` | Same partner lookup fix (lines 96, 267) |
| `src/lib/store.ts` | Use helper in `getPartnerName` (line 598-599), `getPartnerBalances` (lines 1715-1718), `getPartnerBalancesForPeriod` (lines 1756-1759) — already partially fixed but should use centralized helper |

### How the helpers work

The key insight: when storing `handledBy`, company accounts use `partner.id` (UUID) and regular partners use `partner.userId` (auth ID). So when looking up:

1. **Exact `id` match always wins** — this catches company accounts and any partner matched by their record ID
2. **`userId` match as fallback, but skip company accounts** — this catches regular partners matched by their auth user ID without accidentally matching the company account

This eliminates the collision completely and prevents future regressions.


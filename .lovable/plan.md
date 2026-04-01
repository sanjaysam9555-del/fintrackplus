

## Fix Company Bank Account Balance & Name Bugs

### Root Cause
Two interconnected bugs:

1. **When selecting "Handled By"** in transaction forms, the value saved is `partner.userId || partner.id`. For the company account, `userId` is the owner's auth user ID — the same as the owner's personal partner record. This means company account transactions get the same `handledBy` value as the owner.

2. **All partner lookups** across the app use `partners.find(p => p.userId === handledBy)`, which always finds the owner partner first — never the company account. Balance calculations in `getPartnerBalancesForPeriod` also filter by `partner.userId`, merging company account transactions into the owner's totals.

### Fix Strategy
For company accounts, always use `partner.id` (the partner record UUID) as the `handledBy` value instead of `partner.userId`. Update all partner lookups to check both `userId` and `id`.

### Changes

**`src/components/AddTransactionSheet.tsx`** and **`src/components/EditTransactionSheet.tsx`**
- Change `setHandledBy(p.userId || p.id)` to: for company accounts use `p.id`, otherwise use `p.userId || p.id`
- Change `selectedPartner` lookup from `p.userId === handledBy` to `p.userId === handledBy || p.id === handledBy`

**`src/lib/store.ts`** — `getPartnerBalancesForPeriod`
- Change transaction filter from `t.handledBy === partner.userId` to `t.handledBy === partner.userId || t.handledBy === partner.id`

**All other files with `partners.find(p => p.userId === ...handledBy)`** (8 files total):
- `TransactionItem.tsx`
- `TransactionDetailSheet.tsx`
- `UpcomingRecurringCard.tsx`
- `UpcomingRecurringBanner.tsx`
- `PartPaymentTracker.tsx`
- `settings/ReportsSection.tsx` (2 occurrences)
- `settings/PartnersSection.tsx` (2 occurrences)

Update each to: `partners.find(p => p.userId === handledBy || p.id === handledBy)`

### Files to modify
| File | Change |
|---|---|
| `src/components/AddTransactionSheet.tsx` | Use `p.id` for company accounts in setHandledBy; fix selectedPartner lookup |
| `src/components/EditTransactionSheet.tsx` | Same changes |
| `src/lib/store.ts` | Fix `getPartnerBalancesForPeriod` filter to match on both `userId` and `id` |
| `src/components/TransactionItem.tsx` | Fix partner lookup |
| `src/components/TransactionDetailSheet.tsx` | Fix partner lookup |
| `src/components/UpcomingRecurringCard.tsx` | Fix partner lookup |
| `src/components/UpcomingRecurringBanner.tsx` | Fix partner lookup |
| `src/components/PartPaymentTracker.tsx` | Fix partner lookup |
| `src/components/settings/ReportsSection.tsx` | Fix partner lookups |
| `src/components/settings/PartnersSection.tsx` | Fix partner lookups |


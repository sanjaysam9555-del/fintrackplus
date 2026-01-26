

# Fix Missing Partners Realtime Subscription

## Overview

The partners feature code is all in place, but the realtime subscription in `useCloudSync.ts` is missing the `partners` table. This means when partners are added, updated, or deleted, the app doesn't receive live updates from the database.

---

## Issue Analysis

After investigating the codebase, I found that:

1. **All partner components exist and are correctly implemented:**
   - `PartnerBalanceCard.tsx` - Shows partner balances and transfer button
   - `PartnerTransferSheet.tsx` - Handles transfers between partners
   - `PartnersSection.tsx` - Settings page for managing partners (includes `PartnerBalanceCard`)
   - `TransactionItem.tsx` - Shows partner badge on transactions
   - `EditTransactionSheet.tsx` - Has partner selector dropdown

2. **The store has all partner functions:**
   - `addPartner`, `updatePartner`, `deletePartner`
   - `getPartnerBalances()`
   - Partners are correctly synced via the sync queue

3. **The issue: Missing realtime subscription**
   - In `useCloudSync.ts`, the realtime channel subscribes to: `transactions`, `categories`, `vendors`, `projects`
   - The `partners` table is **NOT** included in the realtime subscription
   - This means changes to partners from other devices or direct database operations won't be reflected in the app

---

## Implementation

### File: `src/hooks/useCloudSync.ts`

Add the missing realtime subscription for the `partners` table.

**Current code (lines 271-281):**
```typescript
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`,
        },
        debouncedFetch
      )
      .subscribe();
```

**Updated code:**
```typescript
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`,
        },
        debouncedFetch
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partners',
          filter: `user_id=eq.${user.id}`,
        },
        debouncedFetch
      )
      .subscribe();
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCloudSync.ts` | Add realtime subscription for `partners` table |

---

## Verification Steps

After implementation, partners will:
1. Show in Settings → Partners
2. Display the Partner Balance Card with individual balances
3. Show the "Transfer Between Partners" button when 2+ partners exist
4. Display partner badges on transactions
5. Allow selecting partners in the Edit Transaction form
6. Receive realtime updates when partners are modified

---

## Note on PartnerBalanceCard Visibility

The `PartnerBalanceCard` component returns `null` when no partners exist (`partners.length === 0`). This is intentional design - the card only appears when at least one partner has been added. The empty state is handled in `PartnersSection.tsx` which shows "No partners added yet" message with instructions.


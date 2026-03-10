

# Fix Partner Transfer: Payment Method, Linked Deletion, and Edit Errors

## Problems Identified

1. **Payment method already exists in the form** — the transfer sheet has Cash/Online toggle (lines 290-317), and it does pass `paymentMethod` to both transactions (lines 68, 82). If the UI isn't reflecting the selected method, the issue is likely that the payment method state defaults to `"cash"` and the created transactions correctly use it. **Re-checking**: The code looks correct — the toggle IS there and functional. The user may be experiencing a UI bug where the selection isn't visually obvious, or the balance calculation elsewhere ignores payment method. Need to verify the balance calculation logic.

2. **No linked deletion** — When a transfer creates two transactions (expense for sender, income for receiver), they are independent. Deleting one leaves the other orphaned, causing balance chaos.

3. **Edit errors** — Transfer transactions are regular transactions opened in `EditTransactionSheet`. The error likely occurs when editing a transfer entry (need to check console logs, but the pattern is clear: the two transactions aren't linked).

## Solution

### 1. Link Transfer Transactions via `linkedTransactionId`
- In `PartnerTransferSheet.handleSubmit`: Create the first transaction, capture its ID, then create the second transaction with `linkedTransactionId` pointing to the first. Also set the first transaction's `linkedTransactionId` to point to the second (update after creation).

### 2. Cascade Delete for Linked Transfers
- In `store.ts > deleteTransaction`: Before deleting, check if the transaction has `linkedTransactionId` AND vendor is `'Partner Transfer'`. If so, also delete the linked transaction automatically.

### 3. Cascade Edit for Linked Transfers
- In `store.ts > updateTransaction` or in `EditTransactionSheet`: When saving edits to a transfer transaction, mirror relevant changes (amount, date, payment method) to the linked transaction.
- Alternatively, make transfer transactions non-editable (simpler approach) — show a message "Transfer entries can only be deleted, not edited" since editing one side of a transfer is semantically complex.

### 4. Payment Method — Verify Balance Calculation
- The payment method toggle already exists. Need to verify the partner balance calculation respects `paymentMethod` when computing cash vs online balances.

## Changes

### `src/components/PartnerTransferSheet.tsx`
- Modify `handleSubmit` to generate IDs upfront (two UUIDs), set `linkedTransactionId` on both transactions pointing to each other
- Add a custom `addTransactionWithId` or pass pre-generated IDs

### `src/lib/store.ts`
- **`deleteTransaction`**: Add logic — if deleting a transaction where `vendor === 'Partner Transfer'` and `linkedTransactionId` exists, find and delete the linked transaction too (guard against infinite recursion)
- **`addTransaction`**: Accept an optional `id` parameter so the transfer sheet can pre-generate and cross-link IDs

### `src/components/EditTransactionSheet.tsx`
- For transactions where `vendor === 'Partner Transfer'`, disable editing or sync edits to the linked transaction

### `src/components/TransactionItem.tsx`
- Update delete handler to also handle linked transfer deletion (the store handles it, but ensure undo restores both)

## Files Modified

| File | Change |
|------|--------|
| `src/components/PartnerTransferSheet.tsx` | Pre-generate IDs, cross-link both transactions via `linkedTransactionId` |
| `src/lib/store.ts` | `addTransaction` accepts optional ID; `deleteTransaction` cascades for linked transfers |
| `src/components/EditTransactionSheet.tsx` | Disable or sync edits for transfer transactions |
| `src/components/TransactionItem.tsx` | Ensure undo on delete restores both linked transactions |
| `src/components/TransactionDetailSheet.tsx` | Same undo logic for detail sheet delete |


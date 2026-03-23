

## Fix: Vendor Not Updating When Editing Transactions

### Root Cause
In `EditTransactionSheet.tsx`, the state-reset `useEffect` (line 62-75) has `[transaction]` as its dependency — the entire transaction object. Since the parent component (`TransactionDetailSheet`) passes a new object reference on every render, this effect fires repeatedly, resetting all form fields (including `vendor`) back to the original transaction values. So when a user selects a new vendor, the next render immediately overwrites it.

### Fix
**`src/components/EditTransactionSheet.tsx`** — Change the `useEffect` dependency from `[transaction]` to `[transaction.id]`. This ensures form state only resets when editing a *different* transaction, not on every parent re-render.

```typescript
// Line 75: change dependency
}, [transaction.id]);
```

### Files to modify
| File | Change |
|---|---|
| `src/components/EditTransactionSheet.tsx` | Change useEffect dependency from `[transaction]` to `[transaction.id]` |


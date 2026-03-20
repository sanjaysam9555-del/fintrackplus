

## Exclude Partner Transfers from Income/Expense Totals

### Problem
When a partner transfer is made, the system creates two transactions: one `income` and one `expense`, both with `vendor: 'Partner Transfer'`. The `getTotalIncome` and `getTotalExpense` functions include these, inflating the dashboard totals. Transfers are internal money movements — not real revenue or costs.

### Fix

**`src/lib/store.ts`** — Filter out transfer transactions in `getTotalIncome` and `getTotalExpense`:

```typescript
getTotalIncome: (startDate, endDate) => {
  let transactions = get().transactions.filter(
    (t) => t.type === 'income' && t.vendor !== 'Partner Transfer'
  );
  // ...rest unchanged
},

getTotalExpense: (startDate, endDate) => {
  let transactions = get().transactions.filter(
    (t) => t.type === 'expense' && t.vendor !== 'Partner Transfer'
  );
  // ...rest unchanged
},
```

This ensures transfers still appear in the transaction list and in partner balance calculations, but don't distort the overall income/expense/balance summary on the Dashboard, Transaction List headers, and AI Summary.

### Files to modify
| File | Change |
|---|---|
| `src/lib/store.ts` | Exclude `vendor === 'Partner Transfer'` from `getTotalIncome` and `getTotalExpense` |


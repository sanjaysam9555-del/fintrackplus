

# Fix Missing Entries in Project Details & Vendor Breakdown

## Problem Summary

When viewing a project's details or expanding a vendor's payments, some entries are missing even though they should be displayed. There are two core issues:

### Issue 1: Hardcoded Display Limit of 10 Entries

The `ProjectDetailSheet` component limits visible transactions to **10 entries maximum** for both Income and Expense sections:

```tsx
// Lines 230 and 256 in ProjectDetailSheet.tsx
{incomeTransactions.slice(0, 10).map((transaction) => ...)}
{expenseTransactions.slice(0, 10).map((transaction) => ...)}
```

While the header shows the correct count (e.g., "Income Entries (15)"), only the first 10 appear with a "more entries" message below. This is confusing because users expect to see all entries.

### Issue 2: Transactions Not Reactively Updating

When the project detail sheet opens, the transactions are captured at that moment. If cloud sync happens afterward or there's network latency, newly synced transactions won't appear until the sheet is reopened.

---

## Solution

### Part 1: Remove the 10-Entry Limit

Replace the `.slice(0, 10)` limits with full transaction display. For better UX with large transaction lists, implement collapsible sections that show all entries when expanded.

### Part 2: Use Store Directly for Real-Time Data

Instead of passing pre-filtered transactions as props, have the `ProjectDetailSheet` fetch transactions directly from the store using the `projectId`. This ensures the data is always current.

---

## Technical Changes

### File: `src/components/ProjectDetailSheet.tsx`

**1. Import transactions directly from store (line 53)**

```tsx
// Before
const { getCategoryById, updateProject } = useFinanceStore();

// After
const { getCategoryById, updateProject, transactions: allTransactions } = useFinanceStore();
```

**2. Filter transactions inside the component (new lines after imports)**

```tsx
// Get transactions for this project reactively from the store
const projectTransactions = useMemo(() => {
  if (!project) return [];
  return allTransactions.filter(t => t.projectId === project.id);
}, [allTransactions, project?.id]);
```

**3. Update useMemo to use projectTransactions instead of props (lines 59-68)**

```tsx
// Before
const { sortedTransactions, incomeTransactions, expenseTransactions } = useMemo(() => {
  const sorted = [...transactions].sort(...)
  ...
}, [transactions]);

// After
const { sortedTransactions, incomeTransactions, expenseTransactions } = useMemo(() => {
  const sorted = [...projectTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return {
    sortedTransactions: sorted,
    incomeTransactions: sorted.filter(t => t.type === 'income'),
    expenseTransactions: sorted.filter(t => t.type === 'expense'),
  };
}, [projectTransactions]);
```

**4. Update getVendorTransactions to use projectTransactions (lines 82-86)**

```tsx
// Before
const getVendorTransactions = useCallback((vendorName: string) => {
  return expenseTransactions.filter(t => t.vendor === vendorName)
  ...
}, [expenseTransactions]);

// After - unchanged logic, just uses updated expenseTransactions
```

**5. Remove the .slice(0, 10) limit from Income section (lines 229-244)**

```tsx
// Before
{incomeTransactions.slice(0, 10).map((transaction) => (
  <TransactionItem ... />
))}
{incomeTransactions.length > 10 && (
  <p className="text-center text-sm text-muted-foreground py-2">
    +{incomeTransactions.length - 10} more income entries
  </p>
)}

// After - show all entries
{incomeTransactions.map((transaction) => (
  <TransactionItem
    key={transaction.id}
    transaction={transaction}
    category={getCategoryById(transaction.categoryId)}
    userId={userId}
    onEditSheetChange={onEditSheetChange}
  />
))}
```

**6. Remove the .slice(0, 10) limit from Expense section (lines 255-269)**

```tsx
// Before
{expenseTransactions.slice(0, 10).map((transaction) => ...)}
{expenseTransactions.length > 10 && (...)}

// After - show all entries
{expenseTransactions.map((transaction) => (
  <TransactionItem
    key={transaction.id}
    transaction={transaction}
    category={getCategoryById(transaction.categoryId)}
    userId={userId}
    onEditSheetChange={onEditSheetChange}
  />
))}
```

---

### File: `src/components/ProjectOverviewPage.tsx`

**7. Simplify the props passed to ProjectDetailSheet (lines 365-375)**

The `transactions` prop can now be removed since the sheet fetches data internally, but we'll keep it for backward compatibility and as a fallback.

```tsx
// No changes required here - the sheet will prefer its internal data
// but still accept the prop for consistency
```

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `ProjectDetailSheet.tsx` | Import `transactions` from store | Get real-time data |
| `ProjectDetailSheet.tsx` | Filter transactions by `project.id` in useMemo | React to store updates |
| `ProjectDetailSheet.tsx` | Remove `.slice(0, 10)` from Income entries | Show all income entries |
| `ProjectDetailSheet.tsx` | Remove `.slice(0, 10)` from Expense entries | Show all expense entries |

---

## Before & After

```
BEFORE:                              AFTER:
+----------------------------+       +----------------------------+
| Income Entries (15)        |       | Income Entries (15)        |
| - Entry 1                  |       | - Entry 1                  |
| - Entry 2                  |       | - Entry 2                  |
| - ...                      |       | - Entry 3                  |
| - Entry 10                 |       | - ...                      |
| +5 more income entries     |       | - Entry 15                 |
+----------------------------+       +----------------------------+
                                     (All 15 entries visible)
```


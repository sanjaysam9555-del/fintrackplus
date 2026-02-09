

# Sort Options & Recent Transactions Improvements

## Overview

Two changes requested:
1. **Home page**: Show 10 recent transactions sorted by recency (when they were added), not chronological date/time
2. **Home, Income, Expense tabs**: Add a sort dropdown with multiple sort options, respecting the selected time filter

## What Changes

### 1. Add `createdAt` to Transaction Type and Sync

Currently the `created_at` timestamp from the database is dropped during sync. We need to preserve it so we can sort by "recency" (when the entry was actually created in the app).

**Files:**
- `src/lib/types.ts` -- Add `createdAt?: string` to the `Transaction` interface
- `src/lib/syncEngine.ts` -- Map `created_at` from DB to `createdAt` on the Transaction object
- `src/lib/store.ts` -- Include `createdAt` when creating new transactions locally

### 2. Dashboard: 10 Recent Transactions Sorted by Recency

**File: `src/components/Dashboard.tsx`**

- Change `.slice(0, 5)` to `.slice(0, 10)` to show 10 transactions
- Change sort from `date`/`time` descending to `createdAt` descending (most recently added first)
- This means if you add an entry for a past date, it still shows at the top of "Recent Transactions"

### 3. Sort Dropdown for Home, Income, and Expense Tabs

**Files: `src/components/Dashboard.tsx`, `src/components/TransactionList.tsx`**

Add a sort selector (small dropdown/toggle) near the transaction list header with these options:

| Sort Option | Description |
|------------|-------------|
| Recent | By `createdAt` descending (newest entry first) |
| Date (Newest) | By `date` + `time` descending (default chronological) |
| Date (Oldest) | By `date` + `time` ascending |
| Amount (High) | By `amount` descending |
| Amount (Low) | By `amount` ascending |

- The sort applies WITHIN the currently selected time filter (FY, Week, Month, Year, Custom)
- Default sort: "Recent" for Dashboard, "Date (Newest)" for Income/Expense tabs
- Sort state is local to each tab (not persisted)

### 4. Grouped Display Adjustment

In the Income/Expense tabs, transactions are currently grouped by date. When sorting by amount or recency, the grouping will still use dates but the order within each group and the group order itself will reflect the chosen sort:
- **Date sorts**: Groups ordered by date, transactions within group by time
- **Recent sort**: Groups ordered by most recent entry's `createdAt`, transactions within group by `createdAt`
- **Amount sorts**: No date grouping -- show as a flat sorted list instead

---

## Technical Details

### Transaction Type Update
```typescript
// src/lib/types.ts
interface Transaction {
  // ... existing fields
  createdAt?: string; // ISO timestamp of when entry was created
}
```

### Sync Engine Mapping
```typescript
// src/lib/syncEngine.ts - in the transaction mapping
createdAt: t.created_at || new Date().toISOString(),
```

### Sort Dropdown UI

A compact `Select` dropdown placed next to the "Recent Transactions" header (Dashboard) or above the transaction list (Income/Expense tabs):

```tsx
<Select value={sortBy} onValueChange={setSortBy}>
  <SelectTrigger className="w-[140px] h-8 text-xs">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="recent">Recent</SelectItem>
    <SelectItem value="date-desc">Date (Newest)</SelectItem>
    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
    <SelectItem value="amount-desc">Amount (High)</SelectItem>
    <SelectItem value="amount-asc">Amount (Low)</SelectItem>
  </SelectContent>
</Select>
```

### Dashboard Recent Transactions Sort
```typescript
const filteredTransactions = useMemo(() => {
  return transactions
    .filter(t => t.date >= dateRange.start && t.date <= dateRange.end)
    .slice()
    .sort((a, b) => {
      // Sort by createdAt descending (most recently added first)
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    })
    .slice(0, 10); // Show 10 instead of 5
}, [transactions, dateRange]);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `createdAt?: string` to Transaction interface |
| `src/lib/syncEngine.ts` | Map `created_at` to `createdAt` in transaction sync |
| `src/lib/store.ts` | Set `createdAt` when creating transactions locally |
| `src/components/Dashboard.tsx` | Show 10 items, sort by recency, add sort dropdown |
| `src/components/TransactionList.tsx` | Add sort dropdown with 5 sort options |

---

## Expected Result

- **Home tab**: Shows 10 most recently added entries by default, with a dropdown to change sort
- **Income/Expense tabs**: Sort dropdown synced with the time filter, allowing users to reorder by date, amount, or recency
- All sorting respects the currently selected time period (FY, Week, Month, etc.)

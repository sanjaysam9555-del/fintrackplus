

# Fix "All Time" Chart in Income/Expense Tabs

## Problem
The `TransactionList.tsx` chart has no dedicated logic for `timeFilter === 'all'`. It falls into the `year` branch using the hardcoded date range of 2000-01-01 to 2099-12-31, generating hundreds of empty month data points instead of reflecting only the user's actual transaction history.

The `CashFlowChart.tsx` (Dashboard) already has correct "All Time" logic that detects actual transaction boundaries — this same approach needs to be applied to `TransactionList.tsx`.

## Solution
Add an `'all'` case to the `chartData` computation in `TransactionList.tsx`, mirroring the logic from `CashFlowChart.tsx`:

### File: `src/components/TransactionList.tsx` (lines ~113-240)

Insert a new block **before** the existing `if (timeFilter === 'fy')` check:

```tsx
if (timeFilter === 'all') {
  if (filteredTransactions.length === 0) return [];
  
  const txDates = filteredTransactions.map(t => parseISO(t.date).getTime());
  const earliestDate = new Date(Math.min(...txDates));
  const latestDate = new Date(Math.min(Math.max(...txDates), today.getTime()));
  const realDaysDiff = differenceInDays(latestDate, earliestDate);

  if (realDaysDiff <= 14) {
    // Daily granularity
    for (let i = 0; i <= realDaysDiff; i++) { ... }
  } else if (realDaysDiff <= 60) {
    // Weekly granularity
    for (let i = 0; i < numWeeks; i++) { ... }
  } else {
    // Monthly granularity (with 'MMM' or "MMM 'yy" for >2 years)
    let current = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    while (current <= latestDate) { ... }
  }
  return dataPoints;
}
```

This detects the earliest and latest transaction dates, calculates the real span, and dynamically picks daily/weekly/monthly X-axis granularity — showing only the months/weeks/days that have actual data.

## Files Modified

| File | Change |
|------|--------|
| `src/components/TransactionList.tsx` | Add `timeFilter === 'all'` block to `chartData` with dynamic boundary detection |




# Smart X-Axis for "All Time" Chart View

## Problem
When "All Time" is selected, the date range is set to `2000-01-01` through `2099-12-31`. The chart tries to generate data points across this entire artificial range, resulting in a misleading or empty X-axis. Instead, the chart should automatically detect the user's actual transaction history span and scale the X-axis accordingly.

## Solution
Modify the `CashFlowChart` component to detect actual transaction boundaries when `timeFilter === 'all'`, then choose the right granularity automatically.

## Changes

### File: `src/components/CashFlowChart.tsx`

Add logic at the start of the `chartData` computation (inside `useMemo`) for the `'all'` time filter:

1. **Find actual date range** -- scan all transactions to find the earliest and latest dates
2. **Compute real daysDiff** from earliest to latest transaction
3. **Auto-select granularity** based on the real span:
   - 1-14 days: show individual days (e.g., "Mon", "Tue" or "1", "2")
   - 15-60 days: show weeks ("W1", "W2", ...)
   - 61 days to ~2 years: show months ("Jan", "Feb", ...)
   - Over 2 years: show months with year labels ("Jan '24", "Mar '24", ...)
4. **Override `startDate`/`endDate`** with the actual min/max transaction dates so the X-axis only spans real data

### File: `src/components/TimeFrameSelector.tsx`

Update `computeDateRange` for the `'all'` case:
- Keep returning `{ start: '2000-01-01', end: '2099-12-31' }` since this is used for filtering (we want all transactions included)
- The chart component itself will handle the visual narrowing -- no change needed here

## Technical Detail

Inside `CashFlowChart.tsx`, the `useMemo` block will be updated roughly as follows:

```text
When timeFilter === 'all':
  1. earliestDate = min of all transaction dates
  2. latestDate = max of all transaction dates (capped at today)
  3. If no transactions, return empty array
  4. realDaysDiff = differenceInDays(latestDate, earliestDate)
  5. Pick granularity:
     - realDaysDiff <= 14  -> daily data points
     - realDaysDiff <= 60  -> weekly data points
     - realDaysDiff <= 730 -> monthly ("MMM")
     - realDaysDiff > 730  -> monthly with year ("MMM ''yy")
  6. Generate data points using the chosen granularity
     spanning from earliestDate to latestDate
```

This ensures:
- 4 months of data shows 4 months on the X-axis
- 3 years of data shows ~36 months on the X-axis
- A few days of data shows individual days

Only one file needs meaningful code changes: `src/components/CashFlowChart.tsx`.

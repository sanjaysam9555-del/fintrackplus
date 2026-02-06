
# Fix Charts, Partner Balances, and Duplicate Detection

## Overview

Three critical issues need to be addressed:

1. **Charts not aligned with time filter** - Charts display data outside the selected date range
2. **Partner balances confusing/not useful** - Need time-filtered balances with clearer logic  
3. **Duplicate detection too aggressive** - Shows warnings for completely different entries

---

## Issue 1: Chart Data Not Matching Time Filter

### Current Problem

Looking at the code, I found **mixed behaviors**:

**Dashboard (Line 660)**:
```typescript
<CashFlowChart 
  transactions={transactions.filter(t => t.date >= dateRange.start && t.date <= dateRange.end)} 
  timeFilter={timeFilter}
  dateRange={dateRange}
/>
```
The Dashboard correctly filters transactions before passing to chart.

**TransactionList (Lines 112-211)**:
The chart uses `filteredTransactions` which IS filtered by date range, but then the chart logic generates data points that may extend beyond the date range.

**Problem**: The chart generation logic inside both components creates fixed-period data points (always 7 days for week, 4 weeks for month, 12 months for year/FY) that don't respect the actual `dateRange` boundaries.

For example:
- FY filter sets range as `2025-04-01` to `2026-03-31`
- But the chart shows 12 months starting from April based on a hardcoded calculation
- The chart's internal filtering may not align perfectly with the passed transactions

### Solution

Refactor chart data generation to:
1. Use the exact `dateRange.start` and `dateRange.end` boundaries
2. Only show data points within the selected time frame
3. Ensure transactions are filtered consistently across all tabs

**Files to modify:**
- `src/components/CashFlowChart.tsx`
- `src/components/TransactionList.tsx`

---

## Issue 2: Partner Balances - Complete Redesign

### Current Problem

The current `getPartnerBalances()` function calculates ALL-TIME balances:

```typescript
// store.ts lines 757-791
getPartnerBalances: () => {
  const { transactions, partners } = get();
  return partners.map(partner => {
    const partnerTxns = transactions.filter(t => t.partnerId === partner.id);
    // ... calculates from ALL transactions
  });
}
```

**User's confusion about negative balances:**
The user is correct - if expenses come from income received, a partner shouldn't have a negative balance in practice. The current system allows this because:
1. "Starting Balance" is meant to represent money the partner had BEFORE any tracked transactions
2. If starting balance is 0 but they made expenses, it shows negative

### What the User Actually Needs

For a selected time period, show:
1. **Opening Balance** - The balance the partner had at the START of the selected period
2. **Income Received** - Total income in the period
3. **Expenses Made** - Total expenses in the period  
4. **Closing Balance** - Opening + Income - Expenses

The "Starting Balance" field should represent money BEFORE the first tracked transaction (for initial app setup).

### Solution

1. **Add date-range aware balance calculation** to the store
2. **Update PartnersSection** to accept and use date range filters
3. **Show period-aware balances** with opening/closing breakdown
4. **Clarify UI** to explain the calculation

**New store function:**
```typescript
getPartnerBalancesForPeriod: (startDate: string, endDate: string) => {
  // Calculate opening balance = initialBalance + all transactions BEFORE startDate
  // Calculate period income/expense = transactions IN the period
  // Calculate closing balance = opening + period income - period expense
}
```

**Files to modify:**
- `src/lib/store.ts` - Add new function
- `src/components/settings/PartnersSection.tsx` - Add time filter, use new function
- `src/components/PartnerBalanceCard.tsx` - Update to show period info

---

## Issue 3: Duplicate Detection Too Aggressive

### Current Problem

The duplicate detection algorithm (lines 17-76 in `useDuplicateDetection.ts`) triggers on:

| Factor | Points | Threshold |
|--------|--------|-----------|
| Same vendor | +40 | |
| Similar vendor (substring match) | +20 | |
| Same amount | +35 | |
| Similar amount (±10%) | +15 | |
| Same date | +25 | |
| Within 3 days | +10 | |
| **Total needed to warn** | | **50** |

**Problem scenarios:**
- Different vendor with same amount = 35 points (OK, no warning)
- Same vendor + different amount + within 3 days = 40 + 10 = **50 points → Warning!**
- Any substring match + same amount + within 3 days = 20 + 35 + 10 = **65 points → Warning!**

This is too aggressive. Two transactions at the same vendor days apart with different amounts are clearly NOT duplicates.

### Solution

1. **Increase threshold from 50 to 65** - Require stronger matches
2. **Require amount match as minimum** - Don't warn if amounts are significantly different
3. **Reduce date proximity points** - Being within 3 days is normal behavior
4. **Tighten "similar vendor" logic** - Substring matching is too loose

**New scoring:**
| Factor | Old Points | New Points |
|--------|------------|------------|
| Same vendor | 40 | 35 |
| Similar vendor | 20 | 10 |
| Same amount | 35 | 40 |
| Similar amount (±5%) | 15 | 20 |
| Same date | 25 | 30 |
| Within 3 days | 10 | 5 |
| **Threshold** | **50** | **70** |

**Additional rule**: Only show warning if amount is exactly the same OR within 5%

**File to modify:**
- `src/hooks/useDuplicateDetection.ts`

---

## Technical Implementation

### 1. Store Changes (`src/lib/store.ts`)

Add new function for period-aware partner balances:

```typescript
interface PartnerPeriodBalance {
  partner: Partner;
  openingCashBalance: number;
  openingOnlineBalance: number;
  periodCashIncome: number;
  periodCashExpense: number;
  periodOnlineIncome: number;
  periodOnlineExpense: number;
  closingCashBalance: number;
  closingOnlineBalance: number;
}

getPartnerBalancesForPeriod: (startDate?: string, endDate?: string) => PartnerPeriodBalance[]
```

### 2. Chart Fixes (`src/components/CashFlowChart.tsx`)

Ensure data points are generated ONLY within the passed `dateRange`:
- For FY: Only show months from FY start to current date (not future months)
- For week/month/year: Only show days/weeks/months within the exact date range

### 3. TransactionList Chart (`src/components/TransactionList.tsx`)

Same fix - ensure the mini-chart respects the exact date range selected.

### 4. Partner Section with Filters (`src/components/settings/PartnersSection.tsx`)

Add time filter UI matching Dashboard/TransactionList:
- FY | Week | Month | Year | Custom
- Display period-aware balances

### 5. Duplicate Detection (`src/hooks/useDuplicateDetection.ts`)

Adjust scoring and add minimum requirements:
- Raise threshold to 70
- Require exact/similar amount as a prerequisite
- Reduce false positive rate

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/lib/store.ts` | Add `getPartnerBalancesForPeriod()` function |
| `src/components/CashFlowChart.tsx` | Fix data generation to respect exact date range |
| `src/components/TransactionList.tsx` | Fix chart to respect exact date range |
| `src/components/settings/PartnersSection.tsx` | Add time filter, use period balances |
| `src/components/PartnerBalanceCard.tsx` | Update display for period balances |
| `src/hooks/useDuplicateDetection.ts` | Adjust scoring, raise threshold, add prerequisites |

---

## Expected Results

1. **Charts**: Will only show data for the exact selected time period
2. **Partner Balances**: Will show opening/closing balances for selected period with clear breakdown
3. **Duplicates**: Will only warn for genuine duplicates (same vendor + same/similar amount + same date)

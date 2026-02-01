

# Default to Financial Year View & Clarify Project Data Display

## Overview

This plan addresses two issues:
1. **Default Time Filter**: Change the default view on Home, Expense, and Income tabs to show the current **Financial Year (April 1st to March 31st)** instead of the current calendar month
2. **Project Data Visibility**: Clarify that project data IS correct - the issue is that main tabs filter by time period, while project detail shows ALL transactions for that project

---

## Issue 1: Financial Year as Default View

### What's Happening Now
- **Dashboard** defaults to `'month'` (current calendar month - Jan 1 to Jan 31)
- **Transaction Lists** (Income/Expense tabs) default to `'month'` (last 30 days)
- Users see only recent transactions by default

### The Fix
Add a new **"FY" (Financial Year)** time filter option that:
- Defaults to the current Indian Financial Year (April 1 to March 31)
- If today is Feb 1, 2026 → shows April 1, 2025 to March 31, 2026
- Becomes the new **default** filter instead of 'month'

### Files to Modify

| File | Change |
|------|--------|
| `src/components/Dashboard.tsx` | Add 'fy' filter type, change default from 'month' to 'fy', add FY calculation logic |
| `src/components/TransactionList.tsx` | Add 'fy' filter type, change default from 'month' to 'fy', add FY calculation logic |
| `src/components/CashFlowChart.tsx` | Handle 'fy' filter type for chart display |

### Implementation Details

**New TimeFilter Type:**
```typescript
type TimeFilter = 'fy' | 'week' | 'month' | 'year' | 'custom';
```

**Financial Year Calculation Logic:**
```typescript
// Get current FY bounds
const getFYRange = () => {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();
  
  // FY starts April 1st (month = 3)
  // If we're in Jan-Mar, FY started previous year
  // If we're in Apr-Dec, FY started this year
  const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
  
  return {
    start: `${fyStartYear}-04-01`,
    end: `${fyStartYear + 1}-03-31`
  };
};
```

**Filter Button Changes:**
- Current: `Week | Month | Year | Custom`
- New: `FY | Week | Month | Year | Custom`

**Default Filter:**
- Change: `useState<TimeFilter>('month')` → `useState<TimeFilter>('fy')`

**Label Display:**
- "FY 2025-26" format when FY is selected

---

## Issue 2: Project Data Clarification

### Investigation Results

I analyzed the database and found that **project data IS correct**:

| Project | Income | Expenses | Transactions |
|---------|--------|----------|--------------|
| Nikunj Kanika | ₹930,000 | ₹27,500 | 7 |
| Prathamesh Sunday Manesar | ₹400,000 | ₹131,440 | 14 |
| Shreya Nitin | ₹300,000 | ₹101,650 | 9 |
| Jayant Anubhuti | ₹300,000 | ₹35,750 | 5 |

### Why Users See "Missing" Entries

The confusion stems from different behaviors:
1. **Project Cards** → Show ALL transactions for that project (regardless of date)
2. **Income/Expense Tabs** → Show only transactions within the selected time filter

For example:
- A project transaction from December 2025 appears in the project detail
- But if the Income tab is set to "Month" (January), that transaction won't appear there

### This Is Actually Correct Behavior
- Projects should show their full financial picture (all-time)
- Main tabs should allow filtering by time period

### The Real Fix
Changing the default to **Financial Year** will show almost all transactions by default, reducing confusion. Currently:
- Transaction date range: Nov 12, 2025 → Feb 1, 2026
- FY 2025-26 range: Apr 1, 2025 → Mar 31, 2026
- **All existing transactions will be visible by default**

---

## Technical Changes

### 1. Dashboard.tsx (Lines 28, 32, 48-80, 131-143, 219-237)

**Add FY to TimeFilter type:**
```typescript
type TimeFilter = 'fy' | 'week' | 'month' | 'year' | 'custom';
```

**Change default:**
```typescript
const [timeFilter, setTimeFilter] = useState<TimeFilter>('fy');
```

**Update dateRange calculation:**
```typescript
const dateRange = useMemo(() => {
  const todayDate = new Date();
  
  switch (timeFilter) {
    case 'fy': {
      const currentMonth = todayDate.getMonth();
      const currentYear = todayDate.getFullYear();
      const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
      return {
        start: `${fyStartYear}-04-01`,
        end: `${fyStartYear + 1}-03-31`,
      };
    }
    case 'week':
      // existing logic...
```

**Update getTimeFilterLabel:**
```typescript
case 'fy': {
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
  return `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
}
```

**Update filter buttons to include FY:**
```typescript
{(['fy', 'week', 'month', 'year'] as TimeFilter[]).map((filter) => (
  <button ...>
    {filter === 'fy' ? 'FY' : filter === 'week' ? 'Week' : ...}
  </button>
))}
```

### 2. TransactionList.tsx (Lines 23, 28, 36-69, 214-227)

Same changes as Dashboard:
- Add 'fy' to TimeFilter type
- Change default to 'fy'
- Add FY calculation in dateRange
- Update filter tabs UI

### 3. CashFlowChart.tsx (Lines 26, 41-124)

Add handling for 'fy' time filter:
- Treat it like 'year' for chart display (show 12 months)
- Use FY bounds for data filtering

---

## Summary of Changes

| Change | Impact |
|--------|--------|
| Default to FY | All transactions from Apr-Mar visible by default |
| Add FY option | Users can toggle to FY at any time |
| Keep existing options | Week, Month, Year, Custom still available |
| No project changes needed | Projects already show all-time data correctly |

---

## User Experience After Changes

1. Open app → See "FY 2025-26" badge in header
2. Dashboard shows all income/expenses from April 2025 onwards
3. Income/Expense tabs show full financial year by default
4. Can still filter to Week/Month/Year/Custom as needed
5. Projects continue to show their complete transaction history


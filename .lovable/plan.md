
# Move Recurring Transactions to Respective Pages

## Overview

Currently, the `UpcomingRecurringCard` component on the home page shows all upcoming recurring transactions (both expenses and income) in an elaborate card. This plan will:

1. **Remove** the elaborate `UpcomingRecurringCard` from the Dashboard (home page)
2. **Add minimal recurring sections** to the Expenses and Income pages showing only relevant upcoming payments
3. **Keep it minimal** with a compact, non-intrusive design

---

## Current State

```
┌─────────────────────────────────────┐
│ Home Page (Dashboard)               │
│ ┌─────────────────────────────────┐ │
│ │ Upcoming Payments               │ │
│ │ - Shows ALL recurring (expense  │ │
│ │   + income mixed together)      │ │
│ │ - Header with icon + totals     │ │
│ │ - Up to 3 items with details    │ │
│ │ - "View All" button             │ │
│ │ - Summary grid at bottom        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Target State

```
┌─────────────────────────────────────┐
│ Expenses Page                       │
│ ┌─────────────────────────────────┐ │
│ │ 🔄 2 upcoming • ₹650 due        │ │  ← Minimal inline banner
│ └─────────────────────────────────┘ │
│ [Rest of expenses list...]          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Income Page                         │
│ ┌─────────────────────────────────┐ │
│ │ 🔄 1 upcoming • ₹5000 expected  │ │  ← Minimal inline banner
│ └─────────────────────────────────┘ │
│ [Rest of income list...]            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Home Page (Dashboard)               │
│ [No more UpcomingRecurringCard]     │
└─────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create a Minimal Recurring Banner Component

Create a new lightweight component `UpcomingRecurringBanner.tsx` that:
- Accepts a `type` prop (`'expense' | 'income'`)
- Shows only relevant recurring items for that type
- Displays in a single compact line: icon + count + total amount
- Optionally expandable to show the list (or just links to a modal)

**Design:**
```
┌──────────────────────────────────────────────┐
│ 🔄 2 upcoming expenses • ₹650 due this month │
└──────────────────────────────────────────────┘
```

### Step 2: Update the Recurring Hook

Extend `useRecurringTransactions` to provide filtered helpers:
- `upcomingExpenses` - array of upcoming expense-type recurring
- `upcomingIncome` - array of upcoming income-type recurring

(This data already exists via filtering in the hook, just needs to be exported directly)

### Step 3: Add Banner to TransactionList

Update `TransactionList.tsx` to:
- Import the new `UpcomingRecurringBanner` component
- Render it above the transaction list, passing the `type` prop
- Position it below the summary chart, above the search bar

### Step 4: Remove from Dashboard

Update `Dashboard.tsx` to:
- Remove the `UpcomingRecurringCard` import
- Remove the `<UpcomingRecurringCard />` render (around line 700-702)

### Step 5: Clean Up (Optional)

- Keep the original `UpcomingRecurringCard.tsx` file for potential future use, or delete it if no longer needed

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/UpcomingRecurringBanner.tsx` | **Create** | New minimal component for type-specific recurring display |
| `src/hooks/useRecurringTransactions.ts` | Modify | Export `upcomingExpenses` and `upcomingIncome` arrays directly |
| `src/components/TransactionList.tsx` | Modify | Add the banner above transactions |
| `src/components/Dashboard.tsx` | Modify | Remove `UpcomingRecurringCard` import and usage |

---

## New Component Design: `UpcomingRecurringBanner.tsx`

```typescript
interface UpcomingRecurringBannerProps {
  type: 'expense' | 'income';
}

// Renders:
// - Nothing if no upcoming recurring of that type
// - A single-line compact banner showing count + total
// - Subtle background, small text, minimal footprint
```

**Visual specifications:**
- Height: ~40px (single line)
- Background: `bg-muted/50` or `bg-primary/5`
- Icon: Small repeat icon (14px)
- Text: `text-sm` with muted color
- No border, no shadow (keeps it minimal)

---

## Technical Notes

- The `useRecurringTransactions` hook already calculates `upcomingExpenseTotal` and `upcomingIncomeTotal`
- Filtering the `upcomingRecurring` array by `baseTransaction.type` is straightforward
- The banner should only render when there are items (return null otherwise)
- This follows the existing pattern of conditional rendering used elsewhere in the app

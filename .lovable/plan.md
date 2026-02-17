
# Payment Methods Card: Split by Income and Expense

## Problem
The Payment Methods card currently only shows expense data (Cash vs Online) with no indication that it's expense-only. Users can't tell whether the split applies to incoming or outgoing money.

## Solution
Restructure the card into two clearly labeled sections -- **Outgoing (Expenses)** and **Incoming (Income)** -- each showing its own Cash/Online split with progress bars.

## Changes

### 1. `src/components/AISummaryPage.tsx` -- Compute income payment split

Update the `paymentSplit` memo to also calculate income by payment method:

```
paymentSplit = {
  expenseCash, expenseOnline,
  incomeCash, incomeOnline
}
```

Update the `PaymentMethods` component usage to pass all four values.

### 2. `src/components/ai-summary/PaymentMethods.tsx` -- Redesign with two sections

- Update the props interface to accept `expenseCash`, `expenseOnline`, `incomeCash`, `incomeOnline`
- Extract a reusable `PaymentMethodBar` helper that renders a single Cash/Online row with icon, amount, percentage, and animated progress bar
- Render two labeled sub-sections inside the card:
  - **Outgoing** (with a red/destructive accent) showing expense Cash vs Online
  - **Incoming** (with a green/emerald accent) showing income Cash vs Online
- Each section only renders if its total is greater than zero
- A thin separator divides the two sections when both are visible

### Updated card layout (conceptual):

```text
+-----------------------------+
| Payment Methods             |
|-----------------------------|
| Outgoing                    |
|  Cash      Rs12K       60%  |
|  [========----]             |
|  Online    Rs8K        40%  |
|  [=====-------]             |
|-----------------------------|
| Incoming                    |
|  Cash      Rs30K       45%  |
|  [======------]             |
|  Online    Rs37K       55%  |
|  [========----]             |
+-----------------------------+
```

## Technical Details

- No new files or dependencies needed
- Only two files modified: `AISummaryPage.tsx` (data computation) and `PaymentMethods.tsx` (UI)
- The `formatAmount` helper already exists and will be reused
- Animation delays will be staggered across both sections for a smooth entrance



# Fix: Negative Balance Display in Red

## Problem
1. The Balance summary card on the Home Tab always shows in the default text color, even when the balance is negative (expenses exceed income). It should show green for positive and red for negative.
2. The Cash Flow Trend card always displays the absolute value of the net amount in the default color, without indicating whether it's positive or negative.

## Changes

### 1. `src/components/SummaryCard.tsx`
- Make the balance card's text color dynamic based on the `amount` value
- When `type === 'balance'` and `amount < 0`, use `text-destructive` (red); when `amount >= 0`, use `text-success` (green)
- Add a minus sign prefix for negative balance values
- Update the `AnimatedNumber` usage so that for the balance type, it shows `-` when negative and no prefix when positive

### 2. `src/components/CashFlowChart.tsx`
- Make the total net amount text color dynamic: green when positive, red when negative
- Show a `-` prefix when `totalNet` is negative
- Update the selected point display similarly

## Technical Details

**SummaryCard.tsx changes:**
- In the component body, determine the balance text color dynamically:
  ```typescript
  const textColor = type === 'balance'
    ? (amount >= 0 ? 'text-success' : 'text-destructive')
    : colors.text;
  ```
- For the balance prefix, use: `type === 'balance' && amount < 0 ? '-' : (type === 'expense' ? '-' : '')`
- Also update the icon background color for balance to reflect positive/negative

**CashFlowChart.tsx changes:**
- Change the total net display to use conditional coloring:
  ```typescript
  <p className={cn("text-2xl font-bold", totalNet >= 0 ? "text-success" : "text-destructive")}>
    {totalNet < 0 ? '-' : ''}₹{formatCurrency(Math.abs(totalNet))}
  </p>
  ```
- Same for `selectedPoint.net` display



# Add Vendor & Category to Expanded Transaction Card

## Problem
The expanded transaction card shows Date, Payment, Partner, Project, and Notes — but omits **Vendor** and **Category**, even when they exist on the entry.

## Changes

### File: `src/components/TransactionItem.tsx`

In the expanded details grid (around line 185-220), add two new rows:

1. **Category** — Show if `category` exists and has a name:
```tsx
{category?.name && (
  <div className="flex items-center gap-2 col-span-2">
    <span className="text-muted-foreground">Category:</span>
    <span className="font-medium">{category.name}</span>
  </div>
)}
```

2. **Vendor** — Show if `transaction.vendor` exists and differs from the title (to avoid redundancy since vendor is often shown as the title):
```tsx
{transaction.vendor && transaction.vendor !== transaction.title && (
  <div className="flex items-center gap-2 col-span-2">
    <span className="text-muted-foreground">Vendor:</span>
    <span className="font-medium">{transaction.vendor}</span>
  </div>
)}
```

Place these after the Payment row and before the Partner row in the existing grid.

| File | Change |
|------|--------|
| `src/components/TransactionItem.tsx` | Add conditional Vendor and Category rows to expanded details |


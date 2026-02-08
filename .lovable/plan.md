

# Fix Edit Mechanism Issues Across App

## Problem Summary

The edit functionality is not working correctly in several places:

1. **PartnerDetailSheet**: Missing `onEditSheetChange` prop propagation - when editing transactions from within a partner's detail view, the parent doesn't know an edit sheet is open, causing z-index/visibility conflicts.

2. **PartPaymentTracker**: No edit functionality for part payment entries - users can only view and confirm installments but cannot edit the parent transaction or modify planned installments.

3. **VendorsSection Legacy Handling**: When editing a "legacy vendor" (vendor name in transactions but not in the vendors table), the edit doesn't properly track the original name for updating transactions.

---

## Root Cause Analysis

### Issue 1: PartnerDetailSheet Missing onEditSheetChange

Looking at `PartnerDetailSheet.tsx`, the `TransactionItem` components are rendered without passing the `onEditSheetChange` callback:

```tsx
// Current code (lines 217-223, 250-255)
<TransactionItem
  key={transaction.id}
  transaction={transaction}
  category={getCategoryById(transaction.categoryId)}
  userId={userId}
  // Missing: onEditSheetChange prop
/>
```

When the edit sheet opens, the parent `PartnerDetailSheet` doesn't hide itself, causing layer overlap and interaction issues.

### Issue 2: PartPaymentTracker No Edit Capability

The `PartPaymentTracker` component displays part payment groups with their installments but provides no way to:
- Edit the parent part payment transaction
- Modify planned installments (amount, expected date)
- Delete installments

### Issue 3: VendorsSection originalName Tracking

While the recent fix addressed updating transactions when a vendor name changes, when editing a legacy vendor, we need to ensure `originalName` captures the actual vendor name (not the `legacy-` prefixed ID).

---

## Implementation Plan

### File 1: `src/components/settings/PartnerDetailSheet.tsx`

**Add `onEditSheetChange` prop and pass it to TransactionItem components**

```text
Changes:
- Add onEditSheetChange to props interface
- Pass onEditSheetChange to all TransactionItem instances
```

| Location | Change |
|----------|--------|
| Line 27 | Add `onEditSheetChange?: (isOpen: boolean) => void;` to props interface |
| Lines 217, 251 | Add `onEditSheetChange={onEditSheetChange}` to TransactionItem components |

### File 2: `src/components/PartPaymentTracker.tsx`

**Add edit functionality for part payment entries**

```text
Changes:
- Add onEditPayment callback prop to component
- Add edit button/action for each payment group header
- Allow editing parent transaction when clicked
```

| Location | Change |
|----------|--------|
| Props | Add `onEditPayment?: (transaction: Transaction) => void;` |
| Header section | Add Pencil icon button that calls `onEditPayment(group.parent)` |

### File 3: `src/pages/Index.tsx`

**Wire up the PartnerDetailSheet with onEditSheetChange callback**

Look for where PartnerDetailSheet is rendered and add the prop.

---

## Technical Details

### PartnerDetailSheet Fix

```tsx
interface PartnerDetailSheetProps {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
  dateRange: { start: string; end: string };
  balanceData: PartnerPeriodBalance | null;
  periodLabel: string;
  userId?: string;
  onEditSheetChange?: (isOpen: boolean) => void; // ADD THIS
}

// Then in the JSX, update TransactionItem calls:
<TransactionItem
  key={transaction.id}
  transaction={transaction}
  category={getCategoryById(transaction.categoryId)}
  userId={userId}
  onEditSheetChange={onEditSheetChange} // ADD THIS
/>
```

### PartPaymentTracker Edit Support

```tsx
interface PartPaymentTrackerProps {
  onAddNextPayment?: (parentTransaction: Transaction) => void;
  onEditPayment?: (transaction: Transaction) => void; // ADD THIS
}

// In the header button area, add an edit button:
<button
  onClick={(e) => {
    e.stopPropagation();
    onEditPayment?.(group.parent);
  }}
  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
>
  <Pencil size={14} className="text-muted-foreground" />
</button>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/settings/PartnerDetailSheet.tsx` | Add `onEditSheetChange` prop and pass to TransactionItem |
| `src/components/PartPaymentTracker.tsx` | Add edit button with `onEditPayment` callback |
| Parent components using these | Wire up the new callbacks |

---

## Expected Results

After implementation:
1. **PartnerDetailSheet**: Editing transactions from within a partner's detail view will properly hide the parent sheet, preventing z-index conflicts
2. **PartPaymentTracker**: Users can click an edit button to modify part payment transactions
3. **VendorsSection**: Legacy vendor edits will properly update all associated transactions


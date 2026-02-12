

# Vendor Transaction Detail View and Clickable Entries

## Problem
1. Vendor expanded view shows only 5 recent transactions but has no way to see the rest when there are more than 5
2. Transaction rows in the vendor section are plain text divs -- they can't be clicked to view/edit details like they can in the Project detail view

## Solution

### Part A: Replace plain transaction rows with TransactionItem component

In `src/components/settings/VendorsSection.tsx`:

- Replace the manual grid rows (lines 356-369) with the existing `TransactionItem` component (same one used in `ProjectDetailSheet`)
- This automatically gives each entry click-to-expand behavior with edit/delete options
- Pass `compact` prop for smaller sizing
- Need to import `TransactionItem` and access `getCategoryById` from the store

### Part B: "View All" button and full vendor detail page

When a vendor has more than 5 transactions:

1. Add a "View All (N)" button at the bottom of the recent transactions list
2. Clicking it opens a full-screen vendor detail page (new state `detailVendorName`) that shows:
   - Vendor header with icon, name, total amount, transaction count
   - Projects associated (chips)
   - Full scrollable list of ALL transactions using `TransactionItem` components
   - Back button to return to vendor list
3. Track an `EditTransactionSheet` open state to hide the detail view when editing (same pattern as `ProjectDetailSheet`)

### Files Changed

| File | Change |
|------|--------|
| `src/components/settings/VendorsSection.tsx` | Import `TransactionItem`; replace plain rows with `TransactionItem compact`; add "View All" button; add full vendor detail view state and rendering; get `getCategoryById` from store |

### Detail View Layout

```
[Back] Vendor Name
--------------------------
[Icon] Vendor Name
X transactions | Total: amount

Projects: [chip] [chip]

All Transactions
[TransactionItem] (clickable, expandable)
[TransactionItem]
[TransactionItem]
...
```

The detail view reuses the same page pattern as the VendorsSection itself (sticky header, scrollable content) but is focused on a single vendor's full transaction history.

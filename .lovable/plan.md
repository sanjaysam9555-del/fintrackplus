
# Fix: Black Shadow After Closing Edit Form in Project Detail View

## Problem

When closing the edit transaction form (via Close or Save), a black shadow covers the entire screen. It disappears after tapping anywhere.

## Root Cause

The `modal` prop on the Vaul Drawer toggles instantly when the edit sheet closes:

1. User closes edit form -> `onEditSheetChange(false)` fires immediately
2. `isChildEditing` becomes `false` -> `modal` flips from `false` to `true`
3. Vaul immediately re-creates its modal overlay (dark backdrop) and re-applies body scroll lock
4. But the `DrawerContent` still has the `hidden` CSS class being removed at the same time
5. This creates a flash of Vaul's overlay that requires a tap to dismiss

## The Fix

**File: `src/components/TransactionItem.tsx`**

Add a small delay (300ms) before notifying the parent that editing is done. This allows the edit sheet's exit animation to complete before Vaul switches back to modal mode.

Change the `onClose` callback (around line 342-345):

```
Before:
  onClose={() => {
    setIsEditing(false);
    onEditSheetChange?.(false);
  }}

After:
  onClose={() => {
    setIsEditing(false);
    setTimeout(() => onEditSheetChange?.(false), 300);
  }}
```

This ensures:
- The edit form's framer-motion exit animation (slide down + fade) completes first
- Then Vaul's `modal` prop switches back to `true`
- Vaul's overlay appears naturally as part of the already-visible drawer, with no flash

**File: `src/components/EditTransactionSheet.tsx`**

No changes needed -- the existing `stopPropagation` on buttons is already correct.

**File: `src/components/ProjectDetailSheet.tsx`**

No changes needed -- the `modal={!isChildEditing}` logic is correct, just needs the delayed state update from TransactionItem.

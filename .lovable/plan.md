

# Fix: Edit Sheet Closing Also Closes Project Detail Sheet

## Problem

When editing a transaction entry from within the Project Detail Sheet, closing the edit form (whether saving or canceling) causes both the edit sheet AND the Project Detail Sheet to close. The user expects to return to the Project Detail view, not the main Projects list.

## Root Cause

The issue is a click event propagation problem between stacked modal components:

```
Layer Stack:
+---------------------------+
| EditTransactionSheet      | z-[60] - Portal at body
|   (backdrop click closes) |
+---------------------------+
           ↓ click propagates after unmount
+---------------------------+
| DrawerOverlay             | z-50 - Vaul Drawer
|   (backdrop click closes) |
+---------------------------+
| ProjectDetailSheet        |
+---------------------------+
| ProjectOverviewPage       |
+---------------------------+
```

When the EditTransactionSheet's backdrop is clicked:
1. The backdrop onClick calls `onClose()`
2. The portal unmounts
3. The click event continues to the DrawerOverlay beneath
4. The Drawer's `onOpenChange` fires with `false`
5. ProjectDetailSheet closes

---

## Solution

Prevent the backdrop click from propagating to layers below by adding `e.stopPropagation()` to the EditTransactionSheet's backdrop click handler.

---

## Technical Changes

### File: `src/components/EditTransactionSheet.tsx`

**Line 133 - Add stopPropagation to backdrop click:**

```tsx
// Before
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/40 z-[60]"
  onClick={onClose}
/>

// After
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/40 z-[60]"
  onClick={(e) => {
    e.stopPropagation();
    onClose();
  }}
/>
```

**Line 158 - Add stopPropagation to X button click:**

```tsx
// Before
<button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
  <X size={20} />
</button>

// After
<button 
  onClick={(e) => {
    e.stopPropagation();
    onClose();
  }} 
  className="p-2 rounded-full hover:bg-muted"
>
  <X size={20} />
</button>
```

**Lines 95-120 - Add stopPropagation to handleSubmit (Save button):**

```tsx
// Before
const handleSubmit = async () => {
  if (!amount || !categoryId) return;
  
  await updateTransaction(transaction.id, {
    // ... update data
  }, userId);
  
  toast.success('Transaction Updated', { /* ... */ });
  
  onClose();
};

// After  
const handleSubmit = async (e?: React.MouseEvent) => {
  e?.stopPropagation();
  if (!amount || !categoryId) return;
  
  await updateTransaction(transaction.id, {
    // ... update data
  }, userId);
  
  toast.success('Transaction Updated', { /* ... */ });
  
  onClose();
};
```

---

## Summary

| Location | Change |
|----------|--------|
| Backdrop div (line 133) | Add `e.stopPropagation()` before calling `onClose()` |
| X button (line 158) | Add `e.stopPropagation()` before calling `onClose()` |
| Save button handler | Add `e?.stopPropagation()` in `handleSubmit` |

This ensures that when the EditTransactionSheet closes, the click event doesn't bubble down to trigger the Drawer's close handler, keeping the ProjectDetailSheet open.


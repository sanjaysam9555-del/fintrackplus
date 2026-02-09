
# Fix Edit Form Issues in Project Detail View

## Problem

When editing a transaction from within the Project Detail Sheet (the drawer that opens when you tap a project), the edit form is often:
- Non-responsive to input
- Impossible to close
- Causes the app to hang

This happens because the Project Detail Sheet uses a **vaul Drawer** component whose overlay and drag handlers continue to capture touch/pointer events even when the Edit Transaction Sheet opens on top of it. The two layers fight for event control.

## Root Cause

The `ProjectDetailSheet` is a vaul `Drawer` (renders overlay at z-50). The `EditTransactionSheet` renders via `createPortal` at z-60. Although the edit sheet is visually on top, the vaul Drawer's overlay and built-in drag-to-dismiss logic still intercept touch events, causing:

- Inputs inside the edit form to be unresponsive
- Scroll/drag gestures to trigger the parent drawer's dismiss behavior instead
- The close button and backdrop tap to not register properly
- The app to appear "hung" because events are swallowed

The `PartnersSection` already solved this exact problem by hiding its detail sheet when editing. The `ProjectDetailSheet` needs the same treatment.

## Solution

Hide the `ProjectDetailSheet` drawer when the edit sheet is active, and restore it when editing is done. This is the same pattern already used in `PartnersSection`.

### File: `src/components/ProjectDetailSheet.tsx`

**Track edit state locally and conditionally hide the drawer:**

1. Add a local `isChildEditing` state
2. Create a local `handleEditSheetChange` callback that:
   - Sets `isChildEditing` to show/hide the drawer
   - Also calls the parent `onEditSheetChange` prop (for dock hiding)
3. Pass `handleEditSheetChange` to all `TransactionItem` components instead of `onEditSheetChange`
4. When `isChildEditing` is true, set the Drawer's `open` prop to `false` (or hide it with CSS visibility)

```
Changes at a glance:
- Add: const [isChildEditing, setIsChildEditing] = useState(false);
- Add: handleEditSheetChange callback that sets isChildEditing AND calls parent onEditSheetChange
- Modify: Drawer open prop from `isOpen` to `isOpen && !isChildEditing`
- Pass: handleEditSheetChange to all TransactionItem instances (replacing onEditSheetChange)
```

### File: `src/components/EditTransactionSheet.tsx`

**Raise z-index to ensure it's always above any drawer remnants:**

- Change the backdrop from `z-[60]` to `z-[80]`
- Change the sheet from `z-[60]` to `z-[80]`
- Change popover z-indexes inside from `z-[70]` to `z-[90]`

This ensures even if any drawer element lingers, the edit sheet is unambiguously on top.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ProjectDetailSheet.tsx` | Add `isChildEditing` state; wrap `onEditSheetChange`; hide drawer when editing |
| `src/components/EditTransactionSheet.tsx` | Raise z-index from 60 to 80 for backdrop and sheet; raise inner popovers from 70 to 90 |

## Expected Result

- Tapping "Edit" on any transaction inside the project detail view will smoothly hide the project drawer and show the edit form
- All inputs (amount, title, vendor, category, date) will be fully responsive
- The close button and backdrop tap will work correctly
- Saving or closing the edit form will restore the project detail drawer
- No more app hangs or frozen states

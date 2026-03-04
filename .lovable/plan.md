

# Fix Duplicate Warning Visibility in Transaction Form

## Problem
The duplicate warning renders at the **top** of the form inside a `ScrollArea`. When a user fills in all fields and clicks "Add", the warning appears above the viewport — the user sees nothing happen with no indication why.

## Solution
Replace the inline `DuplicateWarning` at the top of the form with a **toast-style alert dialog** that appears as a modal overlay, visible regardless of scroll position. This ensures the user always sees the warning.

## Changes

### File: `src/components/AddTransactionSheet.tsx`

1. **Remove** the `<DuplicateWarning>` component render from inside the `ScrollArea` (lines ~280-286)
2. **Remove** the `DuplicateWarning` import
3. **Replace** with an `AlertDialog` that opens when `showDuplicateWarning` is true:
   - Shows "Potential Duplicate Detected" title
   - Lists matching transactions with amount, date, and match reasons
   - Two buttons: "Cancel" (dismisses) and "Add Anyway" (proceeds)
   - Rendered **outside** the ScrollArea so it's always visible as a modal overlay

The existing state (`showDuplicateWarning`, `duplicates`) and handlers (`handleDismissDuplicate`, `handleProceedAnyway`) remain unchanged — only the UI presentation changes from an inline banner to a modal dialog.

### Files Modified

| File | Change |
|------|--------|
| `src/components/AddTransactionSheet.tsx` | Replace inline DuplicateWarning with AlertDialog overlay |


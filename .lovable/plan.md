

## Preserve Search After Closing Transaction Detail

### Problem
When a search result is clicked, the transaction detail sheet opens. Closing that sheet also closes the entire search dialog (line 72: `onClose()` is called in `handleCloseTransactionDetail`), and the search query is cleared (line 48-50: `clearSearch()` runs when `isOpen` becomes false). The user loses their search context.

### Fix

**`src/components/GlobalSearchDialog.tsx`** — Two changes:

1. **`handleCloseTransactionDetail`** — Stop calling `onClose()`. Just clear `selectedTransaction` so the user returns to the search results:
   ```typescript
   const handleCloseTransactionDetail = useCallback(() => {
     setSelectedTransaction(null);
   }, []);
   ```

2. **Remove the `clearSearch` on close effect** (lines 47-51) — Instead, clear search only inside `handleResultClick` for non-transaction results (categories/projects/vendors that navigate away). For transactions, the search stays intact. The search will naturally reset when the user explicitly closes the search dialog via the backdrop or ESC key, at which point `onClose` is called by the parent and `isOpen` flips to false — we can clear then but only if no transaction detail is open.

   Actually, simpler: just move `clearSearch()` into the explicit close action (backdrop click / ESC) rather than the `isOpen` effect. This way reopening search starts fresh, but closing a transaction detail doesn't wipe the query.

   Replace the effect with:
   ```typescript
   const handleClose = useCallback(() => {
     clearSearch();
     onClose();
   }, [clearSearch, onClose]);
   ```
   Use `handleClose` for the backdrop `onClick` and ESC handler. Keep `onClose` only in `handleResultClick` for non-transaction navigations.

### Files to modify
| File | Change |
|---|---|
| `src/components/GlobalSearchDialog.tsx` | Stop closing search when transaction detail closes; clear search only on explicit dialog dismiss |


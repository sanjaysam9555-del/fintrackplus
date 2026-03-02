
# Fix: Preserve Scroll Position After Editing a Transaction

## Problem
When you edit a transaction entry and save it, the page scrolls back to the top. This forces you to scroll all the way back down to find where you were. This happens on both desktop and mobile.

## Root Cause
In `src/pages/Index.tsx`, the `handleEditSheetChange` callback explicitly scrolls the container to `top: 0` every time the edit sheet closes:

```typescript
const handleEditSheetChange = useCallback((open: boolean) => {
    setIsEditSheetOpen(open);
    if (!open) {
      requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({ top: 0 }); // <-- This is the culprit
      });
    }
}, []);
```

## Fix
Remove the `scrollTo({ top: 0 })` call from `handleEditSheetChange`. The edit sheet closing should preserve the current scroll position so you stay right where you were.

The same `resetScrollPosition` function is also called when the **Add Transaction** sheet closes -- that one makes more sense to keep since after adding a new entry you may want to see it at the top. But for edits, scrolling to top is disruptive.

### File: `src/pages/Index.tsx`
- Remove the `scrollTo({ top: 0 })` from inside `handleEditSheetChange`
- Keep the `setIsEditSheetOpen(open)` state update (needed for dock visibility logic)

This is a one-line removal that solves the problem.

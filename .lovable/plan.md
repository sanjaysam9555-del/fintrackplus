
# Fix: Edit Transaction Form Not Scrollable in Project Detail View

## Root Cause

The parent Vaul `Drawer` (ProjectDetailSheet) remains `open={true}` even when the child edit sheet appears. Vaul holds a **body scroll lock** (`overflow: hidden`, `data-scroll-locked`) for the entire time its drawer is open. The current MutationObserver hack tries to strip these attributes, but Vaul immediately re-applies them, creating an infinite loop that destabilizes touch event handling on mobile.

The `overflow-hidden` on the outer `motion.div` container combined with this body-level fight makes the inner `overflow-y-auto` div unable to scroll on touch devices.

## The Fix

**File: `src/components/EditTransactionSheet.tsx`**

Replace the MutationObserver approach with a simpler, more reliable strategy:

1. **Remove the MutationObserver `useEffect` entirely** -- it fights Vaul in an infinite loop and is the core problem.

2. **Change the scrollable container** from using flex-based height calculation to an explicit calculated max-height using CSS `calc()`. This removes reliance on flex layout working correctly inside a fixed container with `overflow-hidden`:

   - Change the outer `motion.div` from `max-h-[85vh] flex flex-col overflow-hidden` to just `max-h-[85vh]` (remove `flex flex-col overflow-hidden`)
   - Give the scrollable `div` an explicit `max-h-[calc(85vh-140px)]` (subtracting the header and footer heights) with `overflow-y-scroll` (forced, not auto)

3. **Add `touch-action: pan-y`** on the scrollable container to explicitly tell the browser to allow vertical touch scrolling, preventing Vaul's gesture system from intercepting it.

4. **Keep** `data-vaul-no-drag` and `WebkitOverflowScrolling: 'touch'` as they help on iOS.

### Summary of Changes

```text
Before (line 173):
  className="fixed bottom-0 left-0 right-0 z-[80] bg-card rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden"

After:
  className="fixed bottom-0 left-0 right-0 z-[80] bg-card rounded-t-3xl max-h-[85vh] overflow-hidden"


Before (line 202):
  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-auto" data-vaul-no-drag ...>

After:
  <div className="overflow-y-scroll overscroll-contain touch-pan-y" data-vaul-no-drag 
       style={{ WebkitOverflowScrolling: 'touch', maxHeight: 'calc(85vh - 140px)' }}>
```

- Lines 53-78 (MutationObserver useEffect): **Delete entirely**
- The 140px accounts for: drag handle (~12px) + header bar (~68px) + sticky footer (~60px)

This approach does not fight Vaul at all. It simply gives the scrollable region an explicit pixel-based height constraint and forces scroll behavior, which works reliably on all mobile browsers regardless of body scroll state.

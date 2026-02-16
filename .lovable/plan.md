

# Fix: Edit Transaction Form Not Scrollable in Project Detail View

## Root Cause (Definitive)

The `ProjectDetailSheet` uses a Vaul `Drawer` component. When a transaction is clicked for editing:

1. The Vaul Drawer stays `open={true}` (content is just hidden via CSS `hidden` class)
2. Vaul maintains a **body-level scroll lock** (`overflow: hidden`, `data-scroll-locked`) as long as it's open
3. The `EditTransactionSheet` renders via `createPortal` at body level, but the body is scroll-locked by Vaul
4. Previous fixes (MutationObserver, stopPropagation, explicit heights) all failed because Vaul continuously re-enforces its lock

## The Fix

**Set `modal={false}` on the Vaul Drawer when the child edit sheet is open.** This tells Vaul to release its body scroll lock and pointer-event blocking, allowing the portaled `EditTransactionSheet` to scroll freely.

### Changes

**File: `src/components/ProjectDetailSheet.tsx`** (1 line change)

Line 166 -- add the `modal` prop that toggles based on `isChildEditing`:

```text
Before:
  <Drawer open={isOpen} onOpenChange={...} shouldScaleBackground={false}>

After:
  <Drawer open={isOpen} onOpenChange={...} shouldScaleBackground={false} modal={!isChildEditing}>
```

When `isChildEditing` is `true`, `modal={false}` causes Vaul to:
- Remove `overflow: hidden` from the body
- Remove `data-scroll-locked` attribute
- Remove `pointer-events: none`
- Stop intercepting touch events globally

When editing finishes, `modal` goes back to `true` and Vaul re-applies its normal scroll lock for the drawer.

**File: `src/components/EditTransactionSheet.tsx`** (cleanup)

Remove the `stopPropagation` useEffect and `scrollRef` that were previously added as workarounds -- they are no longer needed since Vaul will no longer be locking scrolling.

- Delete lines 52-74 (the `scrollRef` and touch event `useEffect`)
- Remove `ref={scrollRef}` from the scrollable div (line 199)

### Why This Works

This is the correct API-level solution. Instead of fighting Vaul's scroll lock with hacks, we tell Vaul to stop locking. The `modal` prop is the official Vaul mechanism for this. The drawer content is already hidden via CSS when editing, so there's no visual difference.

### Technical Details

- `modal={false}` in Vaul/Radix means the dialog doesn't trap focus or lock scroll
- The drawer remains mounted (preserving state) but becomes non-modal
- When editing ends, `isChildEditing` becomes `false`, restoring `modal={true}`
- The existing explicit `maxHeight: calc(85vh - 140px)` and `overflow-y-scroll` on the edit form remain and handle the actual scrolling

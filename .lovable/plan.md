

# Fix: Edit Form Unscrollable When Opened From Project Detail Sheet

## Root Cause

The previous fix hides the `DrawerContent` panel with a CSS `hidden` class when a child edit sheet opens, but the **Vaul Drawer overlay** (the semi-transparent black backdrop at `z-50`) remains fully interactive. This overlay captures all touch and scroll events, preventing the EditTransactionSheet (rendered via React Portal at `z-[80]`) from receiving any input.

## The Fix

**File: `src/components/ProjectDetailSheet.tsx`**

When `isChildEditing` is true, add `pointer-events-none` to **both** the `DrawerContent` and its parent overlay so touch events pass through to the edit sheet underneath.

Since the Drawer component renders the overlay separately inside `DrawerPortal`, we need to wrap the entire Drawer output area. The cleanest approach: wrap the Drawer in a container div and apply `pointer-events-none` to it when a child is editing.

```
<div className={isChildEditing ? "pointer-events-none" : ""}>
  <Drawer open={isOpen} onOpenChange={...} shouldScaleBackground={false}>
    <DrawerContent className={cn("max-h-[85vh]", isChildEditing && "hidden")}>
      ...
    </DrawerContent>
  </Drawer>
</div>
```

This ensures the Vaul overlay, backdrop, and all drawer internals stop intercepting pointer events while the edit transaction form is active. When the edit sheet closes, `isChildEditing` returns to `false` and the project detail sheet becomes interactive again.

### Files Modified

| File | Change |
|------|--------|
| `src/components/ProjectDetailSheet.tsx` | Wrap Drawer in a div with conditional `pointer-events-none` |


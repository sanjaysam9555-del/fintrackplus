

# Fix Horizontal Overflow in Project Detail Sheet (Mobile View)

## Problem Identified

The Project Detail Sheet content is extending horizontally beyond the mobile viewport, causing:

1. The **Net card** in the 2x2 financial summary grid to be clipped (only shows "Net +₹")
2. The **Margin Analysis** monetary values to be completely invisible (pushed off-screen)
3. **Transaction items** timestamps and amounts getting cut off at the edge

## Root Cause

While `DrawerContent` has `overflow-hidden`, the inner content containers lack proper width constraints:
- The `ScrollArea` component doesn't have explicit `w-full` constraints
- The inner `<div className="p-4 space-y-6">` allows content to grow beyond viewport
- Currency values with Indian formatting (e.g., "₹10,67,500") are long and push flex layouts
- The Margin Analysis uses `justify-between` but values have no `truncate` or `min-w-0` to prevent overflow

---

## Solution

Add explicit width constraints and overflow handling to all content containers within the drawer.

---

## Technical Changes

### File: `src/components/ProjectDetailSheet.tsx`

| Section | Issue | Fix |
|---------|-------|-----|
| ScrollArea | No width constraint | Add `w-full` class |
| Inner container | Content can overflow | Add `w-full max-w-full overflow-x-hidden` |
| Financial grid | Long amounts overflow | Add `overflow-hidden` to cards, `truncate` to amounts |
| Margin Analysis rows | Values pushed off-screen | Add `min-w-0` to value spans, `shrink-0` to labels |
| Transaction lists | No width constraint | Add `w-full overflow-hidden` wrapper |

### Specific Changes

**1. ScrollArea and Inner Container (lines 152-153)**
```tsx
// Before
<ScrollArea className="flex-1 overflow-auto">
  <div className="p-4 space-y-6">

// After
<ScrollArea className="flex-1 overflow-auto w-full">
  <div className="p-4 space-y-6 w-full max-w-full overflow-x-hidden">
```

**2. Financial Summary Grid Cards (lines 155-180)**
- Add `overflow-hidden` to each card container
- Add `truncate` to all amount `<p>` elements to handle long values gracefully

```tsx
// Before
<div className="bg-muted/50 rounded-xl p-3">
  <p className="text-lg font-bold">₹{...}</p>
</div>

// After  
<div className="bg-muted/50 rounded-xl p-3 overflow-hidden">
  <p className="text-lg font-bold truncate">₹{...}</p>
</div>
```

**3. Margin Analysis Section (lines 184-202)**
- Add `overflow-hidden` to the container
- Add `gap-2` and `min-w-0` to flex rows to prevent overlap
- Add `shrink-0` to labels so they don't compress
- Add `truncate` to values to handle overflow

```tsx
// Before
<div className="flex items-center justify-between text-sm">
  <span className="text-muted-foreground">Expected Margin</span>
  <span className="font-medium">₹{...}</span>
</div>

// After
<div className="flex items-center justify-between text-sm gap-2 min-w-0">
  <span className="text-muted-foreground shrink-0">Expected Margin</span>
  <span className="font-medium truncate">₹{...}</span>
</div>
```

**4. Transaction List Containers (lines 229, 255)**
Add width constraints to prevent TransactionItem overflow:

```tsx
// Before
<div className="space-y-2">

// After
<div className="space-y-2 w-full overflow-hidden">
```

---

## Why This Works

| Constraint | Purpose |
|------------|---------|
| `w-full` | Ensures container doesn't exceed parent width |
| `max-w-full` | Prevents content from growing beyond 100% |
| `overflow-x-hidden` | Clips any content that still overflows |
| `overflow-hidden` on cards | Contains content within card boundaries |
| `truncate` on amounts | Shows ellipsis for very long values |
| `min-w-0` on flex rows | Allows flex items to shrink below content size |
| `shrink-0` on labels | Keeps labels readable, only values truncate |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ProjectDetailSheet.tsx` | Add width constraints and overflow handling |


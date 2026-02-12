

# Fix Animated Numbers & Vendor Edit Button

## Problem 1: Animated Numbers Run Every Time
The `AnimatedNumber` component in `SummaryCard.tsx` runs its count-up animation every time the value changes (e.g., switching tabs, filtering dates). It should only animate on the very first load of the session.

### Fix
- Use a session-level flag (e.g., `sessionStorage` or a module-level variable) to track whether the initial animation has played.
- In `SummaryCard.tsx`, add a `shouldAnimate` check:
  - If it's the first render of the session, animate from 0 to the value.
  - On subsequent renders/value changes, snap directly to the new value (set `motionValue` immediately without spring).
- Use a **module-level variable** (`let hasAnimated = false`) that gets set to `true` after the first render. This survives tab switches but resets on page reload -- matching the desired behavior for both mobile and desktop.

**File: `src/components/SummaryCard.tsx`**
- Add `let hasAnimated = false` at module level
- In `AnimatedNumber`, on first mount: if `!hasAnimated`, animate from 0 (current behavior), then set `hasAnimated = true`
- On subsequent mounts or value changes: set `motionValue` directly using `spring.jump(value)` or set with high stiffness/damping to skip animation

---

## Problem 2: Edit Button Not Working in Vendors
When a user clicks "Edit" on a transaction in either the vendor expanded view or the vendor detail page, the `TransactionItem` sets `isEditSheetOpen = true` via `onEditSheetChange`. This causes the vendor detail view to unmount (line 276: `&& !isEditSheetOpen`), which also unmounts the `TransactionItem` and its `EditTransactionSheet` -- so the edit sheet never appears.

### Fix
Instead of unmounting the detail view, **hide it visually** while keeping it mounted so the `EditTransactionSheet` inside `TransactionItem` remains in the DOM.

**File: `src/components/settings/VendorsSection.tsx`**
- Change line 276 from:
  ```
  if (detailVendorName && detailStats && !isEditSheetOpen) {
  ```
  to:
  ```
  if (detailVendorName && detailStats) {
  ```
- Wrap the detail view's outer `<div>` with a conditional class/style that hides it when `isEditSheetOpen` is true:
  ```
  <div className={cn("min-h-screen bg-background", isEditSheetOpen && "hidden")}>
  ```
  This keeps the component tree mounted (so `EditTransactionSheet` renders) but visually hides the detail page behind the edit sheet.

- Apply the same pattern to the main vendor list view: the `TransactionItem` components in the expanded inline view (lines 479-487) also need their parent to stay mounted. Currently the inline list doesn't check `isEditSheetOpen` for rendering, but the outer return should also use `hidden` instead of conditional unmount if needed. (After review, the inline list doesn't have this issue since it's always mounted.)

### Files Changed

| File | Change |
|------|--------|
| `src/components/SummaryCard.tsx` | Add module-level `hasAnimated` flag; skip animation after first load |
| `src/components/settings/VendorsSection.tsx` | Change detail view from conditional render (`!isEditSheetOpen`) to `hidden` class so edit sheet stays mounted |


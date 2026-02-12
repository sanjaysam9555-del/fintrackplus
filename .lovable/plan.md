

# Fix Quick Action Card Text Fitting

## Problem
The quick action cards (Categories, Vendors, Projects, Reports) use a horizontal (`flex-row`) layout with the icon and label side by side. On smaller screens, the text (especially "Categories") gets clipped or doesn't fit well within the card because `grid-cols-4` divides the available width into 4 equal narrow columns.

## Fix

In `src/components/Dashboard.tsx` (lines 698-713):

1. **Switch back to vertical layout** (`flex-col` instead of `flex-row`) -- vertical stacking ensures the label has the full card width available, preventing clipping
2. **Reduce padding** to `p-2 lg:p-3` and use `gap-1`
3. **Shrink icon container** to `w-6 h-6 lg:w-7 lg:h-7` with icon sizes `12px` / `14px`
4. **Center-align** text and icon (`items-center text-center`)
5. **Reduce label font** to `text-[9px] lg:text-xs` and add `leading-tight truncate w-full` so long labels like "Categories" compress gracefully

This gives a compact, vertically-stacked card where the text always fits within the column width.

## Technical Detail

```
Before (horizontal, text clipped):
  [Icon] Categories

After (vertical, compact):
  [Icon]
  Categories
```

| File | Change |
|------|--------|
| `src/components/Dashboard.tsx` (lines 706-712) | Switch to `flex-col items-center`, reduce padding/icon/font sizes, add `truncate` to label |


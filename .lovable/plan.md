

# Mobile UI Overhaul: PDF Preview, Scrolling, and Projects Page

## Issue 1: PDF Preview Header Still Overlapping

**Root cause**: The `#root` element already applies `padding-top: env(safe-area-inset-top)` globally (index.css line 22). The PDF preview overlay also uses the `safe-top` class, creating **double safe-area padding**. Additionally, the PDF overlay uses `position: fixed` with `top: 0`, which positions it under the root padding rather than at the true top of the viewport.

**Fix in `src/components/settings/ReportsSection.tsx`**:
- Render the PDF preview portal directly into `document.body` (already done) but ensure it escapes the `#root` padding by using `position: fixed; inset: 0` without the `safe-top` class conflicting
- Replace the `safe-top` class on the PDF header with explicit `padding-top: env(safe-area-inset-top)` via inline style, since the fixed overlay sits outside the `#root` flow and needs its own safe-area handling
- Keep the already-fixed icon-only back button and shrink-0 layout

## Issue 2: Vertical Scroll Stuck on iPhone

**Root cause**: Double safe-area padding -- `#root` has `padding-top: env(safe-area-inset-top)` AND every page header adds `safe-top` (another `padding-top: env(safe-area-inset-top)`). This pushes content down excessively and can cause the scroll container to miscalculate available height. The main scroll container in Index.tsx uses `h-screen` but doesn't account for root padding.

**Fix**:
- **`src/index.css`**: Remove `padding-top` and `padding-bottom` from `#root` -- let individual pages handle safe areas via their `safe-top` class (which they already do). Keep left/right for landscape.
- **`src/pages/Index.tsx`**: Change scroll container from `h-screen` to `h-dvh` (dynamic viewport height) for proper iPhone behavior where the browser chrome changes size.

## Issue 3: Projects Portfolio Section Aesthetics

**Current state**: The "Active Portfolio" summary card uses `bg-gradient-to-br from-primary/10 to-primary/5` with hardcoded green/red stat colors that don't adapt well to both themes. The icon containers use low-opacity backgrounds that look washed out.

**Fix in `src/components/ProjectOverviewPage.tsx`**:
- Replace the gradient card with a cleaner card using `bg-card border border-border` for theme consistency
- Use semantic color tokens (`text-success`, `text-destructive`, `text-primary`) instead of hardcoded colors
- Improve the stats layout: use a 3-column grid with equal-width cells instead of flex with dividers, giving each stat its own contained card-like section
- Add subtle icon backgrounds that work in both light/dark: `bg-primary/10`, `bg-destructive/10`, `bg-success/10`
- Better label sizing -- bump from `text-[9px]` to `text-[10px]` for readability

## Issue 4: Project Cards -- Space Optimization and Layout

**Current state**: Each project card has a 2x2 stats grid (Income, Expenses, Internal Cost, Net) with small font and colored backgrounds. The cards take up a lot of vertical space with redundant information. There's significant padding and the 4 stat boxes feel cluttered.

**Fix in `src/components/ProjectOverviewPage.tsx`**:
- **Condense the stats grid**: Replace the 2x2 grid with a compact horizontal row showing key numbers (Spent / Budget / Net) inline, removing the "Internal Cost" box which duplicates what the progress bar already shows
- **Tighten padding**: Reduce card padding from `p-3` to `p-2.5` in header, reduce stat grid gap
- **Better use of the progress bar**: Make it more prominent since it conveys budget status at a glance -- increase height from `h-1.5` to `h-2`
- **Inline key stats**: Show "Spent" and "Budget" as a single line like `Rs 50K / Rs 1L` next to the progress bar instead of separate boxes
- **Remove redundant color backgrounds on stats**: Use a single-row layout with dividers instead of 4 colored boxes
- **Compact empty state**: Reduce padding from `py-12` to `py-8`

---

## Technical Summary

### Files to modify:

**1. `src/index.css`** (lines 19-27)
- Remove `padding-top` and `padding-bottom` from `#root` to eliminate double safe-area padding
- Keep `padding-left` and `padding-right` for landscape support

**2. `src/pages/Index.tsx`** (line 275)
- Change `h-screen` to `h-dvh` on the scroll container for proper dynamic viewport height on iPhone

**3. `src/components/settings/ReportsSection.tsx`** (lines 649-661)
- Use inline style for safe-area top padding instead of the `safe-top` class on the fixed PDF overlay header

**4. `src/components/ProjectOverviewPage.tsx`** (lines 247-295, 361-543)
- Redesign the portfolio summary card: clean card style, 3-column grid stats, better colors
- Redesign project cards: condensed stats row, larger progress bar, tighter padding, remove redundant stat boxes


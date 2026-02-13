
# Desktop Layout Optimization: Projects and AI Summary Pages

## Problem
Both pages render as a single narrow column on desktop, wasting horizontal space. The Projects page stacks cards vertically with no grid, and the AI Summary page caps width at `max-w-4xl` with all cards in a single column.

## Changes

### 1. Projects Page (`src/components/ProjectOverviewPage.tsx`)

**Portfolio summary**: On desktop (md+), make the summary stats row wider and more spacious with larger text sizes.

**Project cards**: Switch from `space-y-3` (single column) to a responsive grid:
- Mobile: single column (current)
- Desktop (md+): 2-column grid
- Large desktop (lg+): 3-column grid

**Add form**: On desktop, constrain the add form width and use wider input layout.

**Overall container**: Remove `md:px-6` padding limitation so content fills the sidebar's remaining space properly. Add `md:max-w-6xl` to prevent ultra-wide stretching on very large monitors.

### 2. AI Summary Page (`src/components/AISummaryPage.tsx`)

**Container**: Change `md:max-w-4xl` to `md:max-w-6xl` to use more horizontal space.

**Card grid**: Wrap the insight cards in a responsive grid layout on desktop:
- FY Hero Card: full width
- 6-Month Trend + Category Breakdown: side by side (2 columns on md+)
- Smart Insights: full width
- Project Health + Payment Methods: side by side (2 columns on md+)

### 3. AI Summary Sub-components

**CategoryBreakdown**: On desktop, make the pie chart and legend larger since there's more room. Increase pie chart size from `w-32 h-32` to `md:w-44 md:h-44`.

**SpendingTrendChart**: Increase chart height from `h-40` to `md:h-52` on desktop for better data visualization.

---

## Technical Details

### File: `src/components/ProjectOverviewPage.tsx`
- Line 147: Add `md:max-w-6xl` to container
- Line 353: Change `<div className="space-y-3">` to `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">`
- Portfolio summary stats: bump text from `text-sm` to `md:text-base` for desktop readability
- Add form: wrap with `md:max-w-lg` to prevent it stretching full width

### File: `src/components/AISummaryPage.tsx`
- Line 201: Change `md:max-w-4xl` to `md:max-w-6xl`
- Line 233: Replace `<div className="px-4 space-y-4">` with a CSS grid layout that places cards side-by-side on desktop:
  - Use a 2-column grid on md+ with `grid-cols-1 md:grid-cols-2`
  - FY Hero Card and Smart Insights span full width (`md:col-span-2`)
  - Trend Chart + Category Breakdown sit side by side
  - Project Health + Payment Methods sit side by side

### File: `src/components/ai-summary/SpendingTrendChart.tsx`
- Line 69: Change `h-40` to `h-40 md:h-52`

### File: `src/components/ai-summary/CategoryBreakdown.tsx`
- Line 74: Change `w-32 h-32` to `w-32 h-32 md:w-44 md:h-44`
- Line 108: Increase truncate width on desktop `max-w-[100px] md:max-w-[160px]`

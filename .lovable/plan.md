

# Dashboard & Time Frame UI Improvements

## Changes Overview

### 1. Remove Calendar Icon and Sync/Refresh Button from Home Tab Header
- **Dashboard.tsx**: Remove the `CalendarDays` icon button and its associated `Popover` (with `CompactTimeFrameSelector`) from both mobile and desktop header action bars
- Remove the `RefreshCw` (sync/refresh) button from both mobile and desktop headers
- Keep the time filter badge row (clicking it will still open the popover) -- actually, since the unified time frame selector will be visible directly, remove the badge row too

### 2. Add Sync Button to Settings Page
- **SettingsPage.tsx**: Add a "Sync Now" button/row in the settings menu (in a new "Sync" section or alongside existing items), wired to the same `onRefresh` callback
- This requires passing `onRefresh`, `isRefreshing`, `isOnline`, `pendingCount`, and `syncStatus` props to SettingsPage (or accessing them from the store)

### 3. Restructure SummaryCard for 3-Row Mobile Layout
- **SummaryCard.tsx**: Change the mobile layout from 2 rows (icon+title | amount) to 3 rows:
  - Row 1: Icon (centered)
  - Row 2: Title text (centered)
  - Row 3: Amount (centered)
- This keeps the single-row grid (`grid-cols-4`) but prevents text truncation by stacking content vertically
- Desktop layout remains as-is with side-by-side icon+title

### 4. Add Unified TimeFrameSelector Directly on Home Tab
- **Dashboard.tsx**: Render the `TimeFrameSelector` component (the tab-bar version, not the compact popover) directly below the header and above the summary cards
- Remove the popover-based date picker entirely since the selector is now always visible

### 5. Remove the FY Badge/Label from Home Tab Header
- **Dashboard.tsx**: Remove the `timeFilterLabel` badge/chip row (lines ~242-293 mobile, ~391-438 desktop) that currently shows "FY 2025-26" etc. The TimeFrameSelector tabs replace this

### 6. Style the TimeFrameSelector
- **TimeFrameSelector.tsx**: 
  - Reduce text size on mobile from `text-sm` to `text-xs` for the tab options to create more spacing
  - Change the selected tab highlight from `bg-card` (white/dark grey) to `bg-primary text-primary-foreground` (blue) so it stands out in both light and dark mode
  - Apply the same blue highlight treatment to the `CompactTimeFrameSelector` (used in other tabs like Income/Expense)

## Technical Details

### Dashboard.tsx
- Remove: `CalendarDays` import usage in header buttons, `RefreshCw` button, `showDatePickerMobile`/`showDatePickerDesktop` state + Popovers, the time filter badge `motion.div` rows
- Add: `import { TimeFrameSelector }` and render it between header and summary cards
- The `TimeFrameSelector` already handles custom date picking with auto-close calendars

### SummaryCard.tsx  
- Change the inner layout from horizontal (icon + title side by side) to vertical on mobile:
```
// Current: flex-row with icon + title
<div className="flex items-center justify-center gap-1.5 mb-1">

// New: flex-col on mobile, flex-row on desktop
<div className="flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-1.5 mb-1">
```

### TimeFrameSelector.tsx
- Selected tab: change from `bg-card shadow-sm` to `bg-primary text-primary-foreground shadow-sm`
- Unselected: keep `text-muted-foreground`
- Mobile text: `text-xs` instead of `text-sm`

### SettingsPage.tsx
- Add sync status display and manual sync button near the profile card or as a separate section
- Pull `syncStatus`, `lastSyncedAt` from store; receive `onRefresh` via props or wire from Index.tsx

### Files Modified
- `src/components/Dashboard.tsx` -- remove header icons, add inline TimeFrameSelector, remove FY badge
- `src/components/SummaryCard.tsx` -- 3-row mobile layout
- `src/components/TimeFrameSelector.tsx` -- blue highlight, smaller text on mobile
- `src/components/SettingsPage.tsx` -- add sync button
- `src/pages/Index.tsx` -- pass sync-related props to SettingsPage (if not already available via store)


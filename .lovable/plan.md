
# Fix iOS Safari Status Bar Overlap

## Problem

On iOS Safari, the app header content (greeting, avatar, etc.) is overlapping with the iOS status bar at the top of the screen. This happens across all tabs because the content is scrolling behind the safe area.

## Root Cause

The app structure has a scroll container with `h-screen` that fills the entire viewport. While the `#root` element has `padding-top: env(safe-area-inset-top)`, the scroll container's content doesn't account for this when it scrolls - causing content to slip behind the status bar area.

## Solution

Add the existing `safe-top` utility class to the header/content sections of each page. This class already exists in `index.css` and provides: `padding-top: max(1rem, env(safe-area-inset-top))`.

---

## Technical Changes

### File: `src/components/Dashboard.tsx`

**Change line 169**: Update the header section to include safe-top padding on mobile:

```tsx
// Before
<div className="p-4 pt-6">

// After  
<div className="p-4 pt-6 safe-top">
```

### File: `src/components/TransactionList.tsx`

**Change line 234**: Update the header section:

```tsx
// Before
<div className="p-4 pt-6">

// After
<div className="p-4 pt-6 safe-top">
```

### File: `src/components/ProjectOverviewPage.tsx`

Apply the same pattern to the header section of this component.

### File: `src/components/AISummaryPage.tsx`

Apply the same pattern to the header section.

### File: `src/components/SettingsPage.tsx`

Apply the same pattern to the header section.

---

## Why This Works

The `safe-top` class uses:
```css
padding-top: max(1rem, env(safe-area-inset-top));
```

This ensures:
- On iOS with notch/dynamic island: Uses the actual safe area inset (typically 44-59px)
- On devices without safe areas: Falls back to 1rem minimum padding
- The content will always start below the status bar, even when scrolled to the top

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/Dashboard.tsx` | Add `safe-top` class to header wrapper |
| `src/components/TransactionList.tsx` | Add `safe-top` class to header wrapper |
| `src/components/ProjectOverviewPage.tsx` | Add `safe-top` class to header wrapper |
| `src/components/AISummaryPage.tsx` | Add `safe-top` class to header wrapper |
| `src/components/SettingsPage.tsx` | Add `safe-top` class to header wrapper |

---

## Expected Result

After this fix:
- The app header will always remain visible below the iOS status bar
- Scrolling to the top will show proper spacing between status bar and app content
- The fix works across all tabs (Home, Expenses, Income, Projects, Settings, AI)
- The change is minimal and uses existing utility classes

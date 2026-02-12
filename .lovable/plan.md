

# Fix Report Preview Header on iPhone 16

## Problems Identified

1. **Header elements overlapping**: The top bar has three elements (Back button with text, "Report Preview" title, "Save PDF" button) fighting for horizontal space on iPhone 16's narrow screen. This causes the garbled/overlapping text visible in the screenshot.

2. **Safe area padding issue**: The `safe-top` class adds padding for the Dynamic Island, but the header content itself isn't given enough breathing room, so elements collide.

## Changes (File: `src/components/settings/ReportsSection.tsx`)

### Fix the top bar layout (lines 649-662)

- Remove the "Back" text label from the back button -- keep only the arrow icon to save space
- Make the "Report Preview" title use `flex-1 text-center` so it centers between the two side elements
- Shrink the Save PDF button text on small screens or keep it compact
- Give the back button and save button fixed/minimum widths so the title gets the remaining space
- Add `truncate` to prevent text overflow

### Before:
```
Back  Report Preview  [Save PDF]
```

### After:
```
<-  Report Preview  [Save PDF]
```

With proper flex layout so elements never overlap.

## Technical Details

The top bar div (line 649) will be updated:
- Back button: Remove the `<span>Back</span>`, keep just `ArrowLeft` icon with proper touch target
- Title: Add `flex-1 text-center truncate` 
- Save PDF button: Keep as-is but ensure it doesn't grow

This is a minimal, targeted fix to the cramped header layout on narrow mobile screens.


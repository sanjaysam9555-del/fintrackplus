

# Swipe-from-Right to Open Settings on Mobile

## Overview
Add a swipe gesture on mobile: swiping left from the right edge of the screen will slide the Settings page in from the right. This provides a quick, native-feeling way to access Settings without navigating through menus.

## How It Works
- On mobile, touching near the right edge of the screen (~30px) and swiping left will trigger the Settings panel to slide in from the right
- The Settings page will appear as a full-screen overlay sliding in from the right with a smooth spring animation
- Swiping right on the Settings page (or tapping a back button) will dismiss it with a slide-out-right animation
- This only applies on mobile (below 768px breakpoint); desktop keeps the sidebar navigation unchanged

## Technical Details

### File: `src/pages/Index.tsx`

1. **Add touch gesture detection** using `useRef` and touch event handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`) on the main content container:
   - Track touch start position; only activate if starting within 30px of the right screen edge
   - On move, calculate horizontal delta; if swiped left more than 80px, trigger settings open
   - Only active when `viewMode` is not already `settings` or `ai`

2. **Update the settings view animation**: When settings is opened via swipe (or any method on mobile), use a `slide-in-from-right` animation variant instead of the current vertical fade:
   - `initial: { x: '100%' }` 
   - `animate: { x: 0 }`
   - `exit: { x: '100%' }`
   - Use a spring transition with `damping: 25, stiffness: 300` for a native feel

3. **Add swipe-to-dismiss on Settings**: When viewing settings on mobile, allow swiping right to go back:
   - Track touch on the settings container
   - If swiped right more than 100px, call `handleBackToHome()`

4. **Visual hint (subtle)**: A very faint edge indicator (a thin semi-transparent gradient line) on the right edge of the screen on mobile, visible only briefly on first session, hinting at the swipe gesture.

### File: `src/components/SettingsPage.tsx`
- No structural changes needed; the animation wrapper in `Index.tsx` handles the transition

### Gesture Logic (in Index.tsx)
```text
Touch Start (right 30px of screen)
    |
    v
Track horizontal movement
    |
    v
Delta X < -80px? --> Open Settings (slide from right)
    |
    v
On Settings: Delta X > 100px? --> Close Settings (slide to right)
```

### What stays the same
- Desktop sidebar navigation is unchanged
- All existing ways to open Settings (gear icon, nav links) still work
- The dock hides when settings is open (existing behavior)
- Settings content and functionality remain identical


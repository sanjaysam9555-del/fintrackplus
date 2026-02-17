

# Fix: Toast Notifications Auto-Dismiss and Close Button

## Problem
Toast notifications (the floating bar at the bottom confirming an entry was recorded) stay on screen far too long and have no close button to dismiss them manually.

## Root Cause
The app uses two toast systems:
1. **Sonner** -- used for transaction success messages (`toast.success(...)` with `duration: 3000`). While the duration is set to 3 seconds, the Sonner `Toaster` component doesn't have `closeButton` enabled.
2. **Radix Toast** (`use-toast.ts`) -- has `TOAST_REMOVE_DELAY` set to `1,000,000ms` (~16 minutes), so dismissed toasts linger in the DOM and may still be visible.

## Changes

### 1. `src/components/ui/sonner.tsx` -- Add close button
Add `closeButton` prop to the Sonner `Toaster` component so every toast gets an X button for manual dismissal.

### 2. `src/hooks/use-toast.ts` -- Reduce remove delay
Change `TOAST_REMOVE_DELAY` from `1000000` (16+ minutes) to `2000` (2 seconds) so Radix-based toasts auto-dismiss properly.

Both changes are single-line edits.



# Fix: Top Spacing Increases After Closing Transaction Forms (iOS PWA)

## Problem
On iPhone PWA, the spacing between the notch and the "Good Evening" text is perfect on initial load. But after opening and closing the Add Transaction or Edit Transaction form, the top spacing grows larger than it should be.

This happens because:
- When the bottom sheet opens and the keyboard appears, iOS adjusts the visual viewport
- When the sheet closes, the main scroll container's scroll position doesn't reset properly, leaving the content shifted down
- The `safe-top` padding stacks with an incorrect scroll offset, creating extra visible space

## Solution
Reset the scroll position of the main content container when transaction sheets close. This ensures the Dashboard header snaps back to its correct position after any sheet interaction.

## Changes

### 1. `src/pages/Index.tsx`
- In the `onClose` callback for `AddTransactionSheet`, scroll the main content container back to the top
- In the `onClose` callback for the edit sheet state change, do the same
- Add a small helper that resets `scrollContainerRef.current.scrollTop = 0` when sheets close

### 2. `src/components/AddTransactionSheet.tsx`
- No changes needed to the sheet itself -- the fix is in the parent that manages scroll

### Technical Detail
The `scrollContainerRef` in `Index.tsx` (line 119) already exists and is attached to the main scrollable div (line 332). The fix simply calls `scrollContainerRef.current?.scrollTo({ top: 0 })` when sheets close, which is a minimal and reliable fix for the iOS viewport shift issue.


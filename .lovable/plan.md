

# Fix: Use Square Logo in Tab Switch Animation

## Problem
The `PageTransition` component imports `@/assets/app-icon.png`, which is the circular version of the logo. Adding `rounded-[25%]` to a circular image has no visible effect -- it still looks round.

## Fix

**File: `src/components/PageTransition.tsx`**

- Remove the import of `@/assets/app-icon.png`
- Use `/app-icon-192.png` (the square/maskable icon in the public folder) as the image source
- Add `overflow-hidden` to ensure the `rounded-[25%]` clip produces the correct squircle shape, matching the brand convention used on the splash screen and landing page

This is a one-line source change plus removing the unused import.


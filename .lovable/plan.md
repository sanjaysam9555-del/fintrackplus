
# Fix: iPhone Status Bar Cutting Off Header

## Problem
On iPhones with the Dynamic Island/notch, the top of the dashboard header ("Good Afternoon, Saffron Events") is hidden behind the system status bar. The greeting text and avatar overlap with the clock and signal icons.

## Root Cause
A CSS specificity conflict: the `safe-top` class (in `@layer components`) is overridden by Tailwind's `pt-6` utility (in `@layer utilities`). Since CSS layers give utilities higher priority, the safe area padding (~59px on modern iPhones) is replaced by a fixed 24px, which is not enough.

## Fix

### 1. Update `safe-top` utility (`src/index.css`)
Move `safe-top` from `@layer components` to `@layer utilities` so it has equal specificity with Tailwind classes, and update it to **add to** the base padding rather than replace it:

```css
.safe-top {
  padding-top: max(1.5rem, env(safe-area-inset-top));
}
```

### 2. Remove conflicting `pt-6` from Dashboard header (`src/components/Dashboard.tsx`)
Change line 191 from:
```
<div className="p-4 pt-6 safe-top">
```
to:
```
<div className="p-4 safe-top">
```

This ensures `safe-top` provides at minimum 1.5rem (24px) on non-notch devices, and the full safe-area-inset on iPhones with notch/Dynamic Island.

### Files Changed
| File | Change |
|------|--------|
| `src/index.css` | Move `.safe-top` to `@layer utilities`, update value to `max(1.5rem, env(safe-area-inset-top))` |
| `src/components/Dashboard.tsx` | Remove `pt-6` from the header div class (line 191) |

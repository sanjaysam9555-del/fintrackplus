
# Fix: Center Hero Section Vertically in Viewport

## Problem
The hero content is not visually centered in the first viewport frame. The asymmetric padding (`pt-12 pb-8` on mobile, `pt-16 pb-16` on desktop) combined with `min-h-[80vh]` pushes the content downward instead of centering it.

## Solution

### `src/components/landing/HeroSection.tsx`

Replace the current padding-heavy approach with proper viewport-aware centering:

1. Change `min-h-[80vh] md:min-h-[90vh]` to `min-h-[calc(100vh-3.5rem)]` -- this makes the hero fill exactly the remaining viewport after the sticky header (h-14 = 3.5rem)
2. Remove the unequal top/bottom padding (`pt-12 md:pt-16 pb-8 md:pb-16`) and replace with symmetric small padding (`py-6 md:py-8`) -- the `flex items-center justify-center` will handle the actual centering
3. The content will now sit truly centered vertically and horizontally within the visible frame

This is a single line change on the `<section>` element's className.

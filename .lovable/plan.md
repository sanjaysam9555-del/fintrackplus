

# Fix Image-Card Contrast in Feature Sections

## Problem
The screenshot thumbnails in both the "Remaining Features" (4-card grid) and "And there's more..." (6-card grid) sections have white/light app screenshots sitting on near-white card backgrounds. This makes the images look washed out and hard to distinguish from the card itself.

## Solution
Add a tinted background and an inset border/shadow to the image container areas so screenshots visually "pop" off the card, creating clear separation between the image and the card surface.

## Changes

### File: `src/components/landing/FeaturesGrid.tsx`

**1. Remaining Features section (4-card grid, ~line 192)**

Update the image container from:
```
bg-muted/30
```
to a darker tinted background with a subtle bottom border:
```
bg-muted/60 border-b border-border/30
```

**2. "And there's more..." section (6-card grid, ~line 278)**

Update the image container from:
```
bg-muted/20
```
to:
```
bg-muted/60 border-b border-border/30
```

These two small changes give the image areas a noticeably darker tint compared to the card body, plus a subtle separator line. This works in both light and dark mode since `muted` and `border` use theme-aware CSS variables.

| File | Change |
|---|---|
| `src/components/landing/FeaturesGrid.tsx` | Increase image container background opacity and add bottom border in both feature grid sections |


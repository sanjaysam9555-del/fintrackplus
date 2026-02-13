
# Fix Hero Section Spacing & Visual Polish

## Issues to Address
1. **Negative space on mobile** -- The hero section has `min-h-[85vh]` with `pt-20 pb-12` creating awkward empty space above and below the content on smaller screens
2. **Background orbs are green-tinted** -- The second orb uses `bg-success/8` (green). Both should use the same blue shade as the primary color
3. **No section divider** -- The transition between the hero text and the mobile carousel section is abrupt

## Changes

### 1. Reduce negative space on mobile
- Change `min-h-[85vh]` to `min-h-[80vh]` for a tighter mobile fit
- Reduce top padding on mobile from `pt-20` to `pt-16` and bottom from `pb-12` to `pb-8`
- Keep desktop values intact with responsive classes

### 2. Make both background orbs blue
- Change the second orb from `bg-success/8` to `bg-primary/8` so both floating orbs share the same blue tone

### 3. Add an aesthetic blended section divider
- Insert a gradient divider between the hero and the mobile carousel section
- Uses a soft fade from `transparent` through `primary/10` back to `transparent`, creating a subtle glowing line effect that feels integrated rather than harsh
- Implemented as a simple `div` with a horizontal gradient background and a thin height (~1px with glow)

## Technical Details

### File: `src/components/landing/HeroSection.tsx`

**Line 29** -- Update section classes:
```tsx
// From:
className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden px-4 pt-20 pb-12 md:pb-16"
// To:
className="relative min-h-[80vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden px-4 pt-16 md:pt-20 pb-8 md:pb-16"
```

**Line 37** -- Change second orb color:
```tsx
// From:
className="absolute bottom-20 left-10 w-96 h-96 bg-success/8 rounded-full blur-3xl"
// To:
className="absolute bottom-20 left-10 w-96 h-96 bg-primary/8 rounded-full blur-3xl"
```

**Between lines 129-132** -- Add a blended divider (mobile only):
```tsx
{/* Blended section divider */}
<div className="md:hidden relative py-2">
  <div className="mx-auto w-2/3 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
  <div className="mx-auto w-1/3 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent mt-px blur-sm" />
</div>
```

This creates a two-layer gradient line: a sharper one on top and a softer blurred glow underneath, giving a refined, blended feel.

| File | Change |
|---|---|
| `src/components/landing/HeroSection.tsx` | Tighten mobile spacing, unify orb colors to blue, add blended gradient divider |

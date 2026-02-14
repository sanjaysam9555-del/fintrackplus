
# Landing Page Improvements Plan

## 1. Fix Floating CTA Centering on Mobile
The current `left-1/2 -translate-x-1/2` approach can conflict with Framer Motion's transform. Fix by wrapping the button in a flex container that handles centering independently of the animation.

## 2. Adjust Part Payment Tracking Phone Mockup
The Part Payment Tracking showcase uses `fit: "contain"` which can leave whitespace inside the phone frame. Change it to `"cover"` with `object-top` positioning so the image fills the frame naturally, matching the other showcase items.

## 3. Add Light Blue Glow Shadow Behind Cards
Apply a subtle `shadow-[0_0_20px_rgba(25,102,205,0.15)]` (light blue glow) to all feature cards across:
- Pain Points section (3 cards)
- "More powerful tools" section (4 cards)
- "And there's more..." section (6 cards)

## 4. Add Dividers Between Cards
Add visual separation using subtle gradient dividers or increased gap with separator lines between cards in:
- Pain Points grid
- Remaining features grid
- Secondary features grid

This will be done via a combination of increased card border opacity and a `ring-1 ring-primary/10` for a subtle blue outline that doubles as both divider and glow boundary.

## 5. Add Sticky Navigation Header
Create a new `LandingHeader` component with:
- FinTrack+ logo on the left
- Navigation links: Features, Pricing, FAQs
- "Get Started" button on the right
- Sticky positioning with glassmorphism backdrop
- Smooth scroll to corresponding sections via anchor IDs
- Add `id` attributes to Pricing and FAQ sections

---

## Technical Details

### Files to Create
- `src/components/landing/LandingHeader.tsx` -- new sticky header with nav links

### Files to Modify
- **`src/components/landing/FloatingMobileCTA.tsx`** -- wrap in a flex centering container instead of relying on translate
- **`src/components/landing/FeaturesGrid.tsx`** -- change Part Payment `fit` to `"cover"`, add glow shadow + ring to remaining/secondary feature cards
- **`src/components/landing/PainPointsSection.tsx`** -- add glow shadow + ring to pain point cards
- **`src/components/landing/PricingSection.tsx`** -- add `id="pricing"` to section element
- **`src/components/landing/FAQSection.tsx`** -- add `id="faqs"` to section element
- **`src/pages/Landing.tsx`** -- import and add `LandingHeader` at top of page

### LandingHeader Design
- Sticky top-0 with `bg-background/80 backdrop-blur-md border-b`
- Logo + "FinTrack+" on left
- Nav links using native `<a href="#features">` for smooth scroll
- Compact "Get Started" button on the right
- Hidden on mobile (mobile already has the floating CTA); or show a hamburger menu

### Card Glow + Divider Approach
Cards will get:
```
shadow-[0_0_24px_rgba(25,102,205,0.12)] ring-1 ring-primary/10
```
This creates a cohesive light blue glow with a subtle ring border that acts as both a visual divider and aesthetic enhancement.

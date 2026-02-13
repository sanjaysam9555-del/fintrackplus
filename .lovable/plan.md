
# Redesign Hero Section: Text-First on Mobile, Carousel Below

## Overview
Restructure the landing hero so that on mobile, the first viewport is a polished, text-only section with logo, branding, value proposition, trust signals, and CTAs. The phone carousel moves to a separate section below, visible only after scrolling. On desktop, the current side-by-side layout remains.

## Current Problem
On mobile, the hero tries to show both the text content and the phone mockup in one view. The phone carousel competes for attention and pushes key messaging below the fold.

## What Changes

### 1. Split hero into two visual sections on mobile

**Section 1 -- "Brand Hero" (mobile-only full viewport)**
- Logo + "FinTrack+" brand name (larger, more prominent)
- Badge: "Built for Indian Wedding Planners"
- Headline: "Stop Losing Money Between Weddings"
- Subtitle (slightly reworked for more impact): "Track every rupee across events, vendors, and partners. Peace of mind at a fraction of hiring a full-time accountant."
- Add a trust/value line: "All the clarity of a CA, at just ~17/day" (derived from 499/month)
- Primary CTA: "Get Started" + Secondary CTA: "See Features"
- Pricing note: "499/month . No hidden fees"
- The phone mockup is **hidden on mobile** (`hidden md:flex`) in this section

**Section 2 -- Phone carousel**  
- On mobile: the phone carousel renders below as a standalone centered block with a subtle heading like "See it in action"
- On desktop: stays in the right column of the hero grid (no change to desktop layout)

### 2. Aesthetic enhancements for mobile hero
- Increase logo size on mobile (w-12 h-12)
- Add a subtle decorative element -- a small row of 3 trust pills below CTA: "Offline Ready", "GST Built-in", "Partner Splits"
- Slightly taller min-height on mobile to fill the viewport better (`min-h-[85vh]`)

## Technical Details

### File: `src/components/landing/HeroSection.tsx`

1. Hide the phone mockup div on mobile: change `className="flex justify-center order-2"` to `className="hidden md:flex justify-center order-2"`

2. Add a new mobile-only carousel section below the main hero section (inside the same component, after the closing `</section>` of the hero):
   ```tsx
   {/* Mobile-only carousel section */}
   <section className="md:hidden py-10 px-4 text-center">
     <p className="text-sm text-muted-foreground mb-4">See it in action</p>
     <div className="w-[240px] mx-auto">
       <PhoneMockup screens={heroScreens} autoPlayMs={3000} className="max-w-none w-full" />
     </div>
   </section>
   ```

3. Update the text content:
   - Change subtitle to: "Track every rupee across events, vendors, and partners. Peace of mind at a fraction of hiring a full-time accountant."
   - Change pricing line to: "starts at ~17/day . No hidden fees"
   - Add trust pills row (3 small badges) after CTAs on mobile:
     ```tsx
     <motion.div variants={springIn} className="mt-5 flex flex-wrap gap-2 justify-center md:justify-start">
       {["Offline Ready", "GST Built-in", "Partner Splits"].map(tag => (
         <span key={tag} className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
           {tag}
         </span>
       ))}
     </motion.div>
     ```

4. Increase mobile logo size: `w-9 h-9` becomes `w-12 h-12 md:w-9 md:h-9`

5. Increase mobile min-height: `min-h-[70vh]` becomes `min-h-[85vh] md:min-h-[90vh]`

### Files Changed

| File | Change |
|---|---|
| `src/components/landing/HeroSection.tsx` | Restructure mobile layout, add trust pills, update copy, separate carousel to below-fold on mobile |

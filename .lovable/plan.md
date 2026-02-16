
# Fix Testimonials, Featured Section, and Slashed Prices

## 1. Remove em dashes from Testimonials

**File: `src/components/landing/TestimonialsSection.tsx`**

Replace all "—" (em dashes) in the quote text:
- Gaurav: "8-10 event setups" (use hyphen), "...every rupee goes. No more digging..." (replace dash with period)
- Gauri: "...books were. First time..." (replace dash with period)

## 2. Redesign "Featured In" Section

**File: `src/components/landing/FeaturedInSection.tsx`**

The current section is plain muted text. Upgrade to a more polished look:
- Add a subtle pill/badge style for each brand name with a border, slight background tint, and padding
- Use a separator dot or vertical divider between brands
- Add a faint gradient line above the brand row for visual separation
- Slightly increase font size and give each brand a subtle hover glow or shimmer animation
- Keep the muted/editorial tone but make it feel intentional and premium, not just plain text

## 3. Add Slashed Prices Everywhere

### 3a. HeroSection (line 116)
**File: `src/components/landing/HeroSection.tsx`**

Change: `Starts at ~₹17/day`
To: `Starts at <span class="line-through text-muted-foreground">~₹27/day</span> <span class="font-semibold text-foreground">~₹17/day</span>`

(₹799/month = ~₹27/day, ₹499/month = ~₹17/day)

### 3b. ComparisonSection bottom row (lines 83-86)
**File: `src/components/landing/ComparisonSection.tsx`**

Change the FinTrack+ price cell to show:
- Slashed `₹799` above the `₹499`
- Slashed `~₹27/day` before `~₹17/day`

### 3c. PricingSection per-day line (line 111)
**File: `src/components/landing/PricingSection.tsx`**

Change: `That's just ~₹17/day for complete peace of mind`
To: `That's just <span class="line-through">~₹27/day</span> ~₹17/day for complete peace of mind`

### 3d. LandingFooter (line 38)
**File: `src/components/landing/LandingFooter.tsx`**

Change: `₹499/month`
To: `<span class="line-through">₹799</span> ₹499/month`

### 3e. FAQSection (line 43)
**File: `src/components/landing/FAQSection.tsx`**

Update the pricing FAQ answer to include the slashed original price.

## Summary of Files Changed
- `TestimonialsSection.tsx` -- remove em dashes from quotes
- `FeaturedInSection.tsx` -- redesign with pill badges and visual polish
- `HeroSection.tsx` -- add slashed ₹27/day before ₹17/day
- `ComparisonSection.tsx` -- add slashed ₹799 and ₹27/day in bottom row
- `PricingSection.tsx` -- add slashed ₹27/day in the per-day subtitle
- `LandingFooter.tsx` -- add slashed ₹799 before ₹499
- `FAQSection.tsx` -- add slashed price in FAQ answer



# Landing Page Overhaul: Visuals, Pricing, and Mobile Optimization

## What's Changing

### 1. Pricing Corrections (across multiple files)
All references to "free", "no credit card" must be updated to reflect the paid model:
- **Rs. 499/month subscription**
- **7-day free trial** (to still have a low-friction entry point)
- Credit card required at signup

**Files affected:**
- `HeroSection.tsx` -- CTA changes from "Start Free" to "Start 7-Day Free Trial", subtext changes to "Rs. 499/month after trial"
- `HowItWorks.tsx` -- Step 1 description updated
- `FAQSection.tsx` -- "Is it free?" answer rewritten with pricing details
- `LandingFooter.tsx` -- "Get Started Free" changed to "Start Your Free Trial"

### 2. New Pricing Section (new component)
A dedicated pricing card section inserted between PersonaSection and FAQSection:
- **File:** `src/components/landing/PricingSection.tsx`
- Single plan card: "Rs. 499/month"
- Feature checklist showing everything included
- "Start 7-Day Free Trial" CTA
- "Cancel anytime" reassurance text

### 3. Hero Section Overhaul (mobile-first)
The current hero has a phone mockup that's too small on mobile and doesn't convey the app well.

**Changes to `HeroSection.tsx`:**
- On mobile: hide the phone mockup entirely, replace with a horizontally scrollable row of 3 mini feature highlight cards (e.g., "Track ₹18L+", "5 Weddings", "Cash + Online") that give immediate visual context
- On desktop: keep the phone mockup but make it larger and more detailed
- Add social proof line: "Trusted by wedding planners across India"
- Update CTA button and subtext for paid model

### 4. App Screen Mockups Alongside Features
Since we can't capture real screenshots with data, we'll build **detailed CSS-rendered app screen mockups** that look like real screenshots. These will be placed alongside feature descriptions in an alternating layout (text left / mockup right, then swap).

**Changes to `FeaturesGrid.tsx`:**
- Restructure the top 4 primary features into a "Feature Showcase" format: each feature gets a full-width row with text on one side and a detailed CSS mockup on the other
- Alternating layout: odd features have text-left/mockup-right, even features swap
- The remaining 4 primary features stay in the existing 2-column card grid
- Each mockup is a realistic representation of the actual app screen for that feature

**CSS Mockups to build (inline in FeaturesGrid):**
1. **Wedding-as-a-Project** -- A project card showing "Sharma-Gupta Wedding", Internal Cost ₹14L, Client Cost ₹18L, margin bar at 22%, health badge "Healthy"
2. **Partner Tracking** -- Two partner cards with Cash/Online split balances, transfer button
3. **Part Payment Tracker** -- A vendor installment view with progress bar at 60%, upcoming dates
4. **GST Export** -- A mock export preview showing CSV rows, receipt thumbnails, ZIP download button

### 5. Mobile Optimization
- All feature showcase mockups stack vertically on mobile (mockup below text)
- Mockups scale down gracefully with `max-w-sm mx-auto` on mobile
- Pain points section: cards stack to single column on very small screens
- Secondary features grid: `grid-cols-2` on mobile (already correct)
- Add `scroll-smooth` to the landing page for smooth anchor navigation on mobile
- Hero section min-height reduced on mobile from `min-h-[90vh]` to `min-h-[80vh]` to show more content above the fold

### 6. Landing Page Structure Update
**File: `src/pages/Landing.tsx`** -- Add the new PricingSection between PersonaSection and FAQSection.

---

## Technical Details

### New File: `src/components/landing/PricingSection.tsx`
- Single pricing card with glass-morphism styling
- Checklist of all included features (12-15 items)
- "Rs. 499/month" prominently displayed
- "Start 7-Day Free Trial" button linking to `/auth`
- Framer Motion fade-up animation

### Modified: `src/components/landing/HeroSection.tsx`
- Mobile: replace phone mockup with 3 mini stat cards in a horizontal row
- Use `hidden md:flex` on phone mockup, `flex md:hidden` on mobile stat cards
- CTA: "Start 7-Day Free Trial" with ArrowRight icon
- Subtext: "Rs. 499/month after trial -- Cancel anytime"
- Add a trust line with a subtle icon

### Modified: `src/components/landing/FeaturesGrid.tsx`
- Top 4 features become full-width alternating rows with CSS mockups
- Each mockup is a `div` styled to look like a phone/app screen with realistic data
- Bottom 4 primary features remain as 2-column cards
- Secondary features grid unchanged

### Modified: `src/components/landing/HowItWorks.tsx`
- Step 1 description: "Email + password. 7-day free trial, no commitment." (remove "no credit card")

### Modified: `src/components/landing/FAQSection.tsx`
- "Is it free?" rewritten: "FinTrack+ is Rs. 499/month. Every new account gets a 7-day free trial with full access to all features. Cancel anytime before the trial ends and you won't be charged."
- Add new FAQ: "What payment methods do you accept?" -- "Credit card, debit card, and UPI. All payments are processed securely."

### Modified: `src/components/landing/LandingFooter.tsx`
- FinalCTA button text: "Start Your Free Trial"
- Remove "Get Started Free"

### Modified: `src/pages/Landing.tsx`
- Import and add `PricingSection` between `PersonaSection` and `FAQSection`

### Summary of all files changed:
1. `src/components/landing/HeroSection.tsx` -- mobile hero, pricing text, CTA
2. `src/components/landing/FeaturesGrid.tsx` -- alternating feature showcase with CSS mockups
3. `src/components/landing/PricingSection.tsx` -- NEW pricing section
4. `src/components/landing/HowItWorks.tsx` -- step 1 text fix
5. `src/components/landing/FAQSection.tsx` -- pricing FAQ updates
6. `src/components/landing/LandingFooter.tsx` -- CTA text fix
7. `src/pages/Landing.tsx` -- add PricingSection import and placement

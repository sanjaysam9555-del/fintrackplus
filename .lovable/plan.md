
# Landing Page Overhaul Plan

This plan covers 6 areas: logo fix, glow shadows, CTA redesign, Part Payment image fit, Persona section redesign, and "Wedding Planners" to "Indian Event Planners" text replacement.

---

## 1. Fix Logo to Rounded Square (Not Circular)

The `appIcon` image file itself is circular/round. The CSS `rounded-xl` cannot make a round image appear square. The fix is to wrap the image in a square container with `rounded-xl`, a background color, and padding so the logo sits inside a visible rounded-square box.

**Files**: `HeroSection.tsx`, `LandingHeader.tsx`

- Wrap the logo `<img>` in a `div` with `w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center` and size the img smaller inside (e.g. `w-7 h-7`)
- Apply the same pattern in `LandingHeader.tsx` for consistency
- This ensures the rounded-square shape is visible regardless of the source image shape

---

## 2. Add Glowing Shadows Behind Mockups, Feature Cards, and Pricing

Currently only some cards have `shadow-[0_0_24px_...]`. The phone mockups and pricing card are missing the glow effect.

**Files**: `PhoneMockup.tsx`, `PricingSection.tsx`, `HowItWorks.tsx`, `FeaturesGrid.tsx`

- **PhoneMockup**: The existing `-inset-6 bg-primary/15 blur-3xl` glow div exists but may be too subtle. Increase to `bg-primary/20` and add `shadow-[0_0_32px_rgba(25,102,205,0.15)]` on the phone container
- **PricingSection**: Add `shadow-[0_0_32px_rgba(25,102,205,0.15)] ring-1 ring-primary/10` to the pricing card
- **HowItWorks**: Add a subtle glow to each step card container
- **FeaturesGrid showcase cards**: Add glow shadow to the text+mockup showcase containers

---

## 3. Redesign CTAs (Header + Floating Mobile)

Make both CTAs more creative and eye-catching.

**Files**: `LandingHeader.tsx`, `FloatingMobileCTA.tsx`, `HeroSection.tsx`

- **Header CTA**: Add a gradient background (`bg-gradient-to-r from-primary to-primary/80`), a subtle animated shimmer/pulse effect, and a glow shadow (`shadow-lg shadow-primary/25`)
- **Floating Mobile CTA**: Replace the plain button with a glassmorphism pill featuring a gradient background, animated border glow, and a subtle pulsing ring animation. Add a `backdrop-blur-md` frosted glass effect with `bg-primary/90`
- **Hero CTA**: Add gradient styling and a subtle hover scale animation for more visual impact

---

## 4. Part Payment Image -- Fit, Not Fill

Currently the Part Payment Tracking showcase screen has no `fit` property specified, so PhoneMockup defaults to `object-cover`. Change it to `object-contain` so the image fits within the mockup frame without cropping.

**File**: `FeaturesGrid.tsx`

- Change the Part Payment screen entry to: `{ src: partPaymentCropped, alt: "...", fit: "contain" }`

---

## 5. Redesign "Who Is This For?" (Persona Section)

Transform the current plain card grid into a more visually engaging layout.

**File**: `PersonaSection.tsx`

New design approach:
- Use a **featured card layout**: the first persona (Solo Planners) spans full width as a horizontal card with a larger icon area and gradient accent, while the remaining two sit side by side below
- Each card gets: a large gradient-filled icon area at the top, a numbered step indicator, the blue glow shadow and ring treatment
- Highlights become checkmark items instead of plain pills for better readability
- Add a subtle gradient border on the left side of each card for color accent
- Each card gets a distinct accent color (primary, success, warning) for visual variety
- Increase padding and font sizes for better readability

---

## 6. Replace "Wedding Planners" with "Indian Event Planners"

Global text replacement across all landing page components.

**Files**: `HeroSection.tsx`, `PainPointsSection.tsx`, `PersonaSection.tsx`, `FeaturesGrid.tsx`, `PricingSection.tsx`, `HowItWorks.tsx`, `LandingFooter.tsx`

Key replacements:
- "Built for Indian Wedding Planners" -> "Built for Indian Event Planners"
- "Between Weddings" -> "Between Events"
- "Every wedding planner in India" -> "Every event planner in India"
- "Solo Wedding Planners" -> "Solo Event Planners"
- "wedding projects" -> "event projects"
- "Wedding-as-a-Project" -> "Event-as-a-Project"
- "Create a project per wedding" -> "Create a project per event"
- "across all weddings" -> "across all events"
- "wedding finance" -> "event finance"
- "Your next wedding deserves" -> "Your next event deserves"
- "Join wedding planners" -> "Join event planners"
- "Create your first wedding project" -> "Create your first event project"
- "after the wedding is over" -> "after the event is over"
- Alt text references updated similarly

---

## Technical Summary

| File | Changes |
|------|---------|
| `HeroSection.tsx` | Logo wrapper, CTA gradient, text replacements |
| `LandingHeader.tsx` | Logo wrapper, CTA glow + gradient |
| `FloatingMobileCTA.tsx` | Glassmorphism pill with gradient + pulse animation |
| `PhoneMockup.tsx` | Stronger glow behind mockup |
| `PricingSection.tsx` | Card glow shadow, text replacement |
| `PainPointsSection.tsx` | Text replacement |
| `PersonaSection.tsx` | Full redesign with featured layout, glow, checkmarks, text replacement |
| `FeaturesGrid.tsx` | Part Payment fit:contain, showcase glow, text replacements |
| `HowItWorks.tsx` | Step card glow, text replacement |
| `LandingFooter.tsx` | Text replacements |

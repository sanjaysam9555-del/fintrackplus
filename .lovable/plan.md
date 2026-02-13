

# Landing Page Visual Overhaul: Real Images + Hero Revamp

## Problem
The landing page is text-heavy with only CSS mockups and Lucide icons. There are no real images alongside pain points, features, personas, or the hero section. On mobile, the hero feels weak.

## Approach: AI-Generated Images
We'll use the **Lovable AI image generation** (google/gemini-2.5-flash-image) via a one-time edge function to generate contextual images for each section, store them in file storage, and reference them in the landing page components.

### Images to Generate (8-10 total)

1. **Hero**: A stylized illustration of a wedding planner at a desk with a phone/tablet showing a finance dashboard, Indian wedding elements (marigolds, mandap) in the background
2. **Pain Point 1 - Cash Leaks**: Illustration of scattered cash, WhatsApp messages, and a notebook with messy handwriting
3. **Pain Point 2 - No Margin Visibility**: Illustration of a confused planner looking at bills stacking up
4. **Pain Point 3 - GST Headaches**: Illustration of receipts scattered across a desk with a stressed expression
5. **Persona - Solo Planner**: Illustration of a single professional with a phone managing events
6. **Persona - Agency Team**: Illustration of a small team coordinating with tablets/phones
7. **Persona - Event Coordinator**: Illustration of a coordinator presenting reports to a client
8. **How It Works - Visual**: A clean illustration showing sign-up to dashboard flow

### Implementation

#### Step 1: Edge Function for Image Generation
Create `supabase/functions/generate-landing-images/index.ts`:
- Calls the AI image generation API for each required image
- Uploads results to a `landing-assets` storage bucket
- Returns the public URLs
- Protected by a manual trigger (not public)

#### Step 2: Storage Bucket
Create a `landing-assets` public storage bucket to store the generated images.

#### Step 3: Component Updates

**`HeroSection.tsx`** -- Complete revamp:
- Replace the CSS phone mockup with a real AI-generated hero image
- On mobile: show the hero image above the text (full-width, rounded corners) instead of tiny stat cards
- On desktop: large hero image on the right side with a subtle phone frame overlay
- Keep the stat cards below the CTA on mobile as secondary content

**`PainPointsSection.tsx`**:
- Add an image above or beside each pain point card
- On mobile: image sits above the text inside each card
- On desktop: image as a small illustration to the left of the text

**`FeaturesGrid.tsx`**:
- Keep the existing CSS mockups (they're actually good for showing app functionality)
- Add a subtle background illustration behind each showcase row for visual richness

**`PersonaSection.tsx`**:
- Replace the generic Lucide icon with a contextual illustration for each persona type
- Image fills the top portion of each card

**`HowItWorks.tsx`**:
- Add a step illustration above each step's icon

### File Changes Summary

| File | Action |
|------|--------|
| `supabase/functions/generate-landing-images/index.ts` | Create -- edge function to generate and store images |
| `src/components/landing/HeroSection.tsx` | Modify -- revamp with real image, better mobile layout |
| `src/components/landing/PainPointsSection.tsx` | Modify -- add images to each card |
| `src/components/landing/PersonaSection.tsx` | Modify -- replace icons with illustrations |
| `src/components/landing/HowItWorks.tsx` | Modify -- add step illustrations |

### Technical Notes
- Images are generated once via the edge function and stored permanently in the storage bucket
- All `<img>` tags will use `loading="lazy"` for performance
- Images will have proper `alt` text for accessibility
- Responsive sizing: images use `object-cover` with appropriate aspect ratios per breakpoint
- The CSS mockups in FeaturesGrid remain unchanged -- they effectively demonstrate app functionality
- All images will be optimized illustrations (not photographs) for consistent visual style


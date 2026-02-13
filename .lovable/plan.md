

# Landing Page Complete Revamp

## Issues Being Fixed

1. **No real app visuals** -- Features, pain points, and solutions lack actual screenshots or app previews showing what the user gets
2. **Hero section is weak** -- Cartoon-style AI image doesn't convey professionalism; copy mentions "free trial" which doesn't exist
3. **"How It Works" is wrong** -- References trials; image is a generic AI illustration
4. **FAQ cards look bad** -- Floating pill-style cards with inconsistent alignment; accordion style feels cheap
5. **All CTAs reference trials** -- The app costs Rs. 499/month with credit card required, no free tier or trial

---

## What Changes

### 1. Generate Real App Screenshots (Edge Function)

Create an edge function that uses AI image generation to produce **realistic app screen mockups** (not cartoons) for each feature. These will look like actual phone screenshots showing:

- **Dashboard** with INR amounts and project cards
- **Indian Financial Year** view showing Apr-Mar range
- **Recurring Transactions** setup screen
- **Vendor Management** directory view
- **Part Payment Tracker** with installment progress
- **Partner Balance** with cash/online split
- **GST Export** ZIP download screen
- **Receipt Capture** camera/gallery attach
- **AI Summary** insights dashboard
- **Global Search** (Cmd+K) overlay
- **Duplicate Detection** warning toast
- **Offline Sync** pending indicator

Store all images in a `landing-assets` storage bucket.

### 2. Hero Section -- Complete Redesign

**New approach:**
- Remove the cartoon AI illustration entirely
- Show a **realistic phone frame** with a generated app dashboard screenshot inside it
- On mobile: phone mockup sits below the headline at ~60% width, centered
- On desktop: phone mockup on the right, angled slightly with shadow
- Fix CTA: "Get Started" (not "Start Free Trial")
- Fix subtext: "Rs. 499/month -- Credit card required"
- Remove "Trusted by wedding planners" (unverified claim)

### 3. Feature Sections -- Add Screenshots Alongside Every Feature

**Primary Feature Showcase (FeaturesGrid.tsx):**
- Keep the alternating text/mockup layout but replace CSS mockups with actual generated screenshot images
- Each of the 4 showcase features gets a phone-frame screenshot

**Secondary Features ("And there's more..."):**
- Transform from tiny icon-only cards to **larger cards with a screenshot thumbnail** above each title
- Each of the 8 secondary features (Indian FY, Recurring, Duplicate Detection, Offline Sync, Global Search, Undo, Custom Categories, Dark Mode) gets its own screenshot
- Layout: 2-column grid on mobile, 4-column on desktop, with image taking the top half of each card

**Remaining primary features (Vendor, Cash Split, Receipt, AI Insights):**
- Add a small screenshot thumbnail inside each card

### 4. Pain Points -- Replace AI Cartoons

- Replace the 3 cartoon illustrations with more abstract/professional visuals
- Use gradient overlays with relevant icons instead of AI-generated cartoon people
- Or generate more professional, minimal illustrations (not cartoon style)

### 5. How It Works -- Fix Content

- Step 1: Change from "7-day free trial, no commitment" to "Email + password. Set up in under a minute."
- Remove the large AI illustration entirely; the 3-step cards with icons are sufficient
- Clean, minimal look

### 6. FAQ Section -- Redesign

- Replace the floating pill cards with a clean, full-width accordion style
- Left-aligned questions with a subtle divider between each
- Smooth expand/collapse with proper padding
- Remove "How much does it cost?" answer referencing trials
- Update to: "Rs. 499/month. Credit card required at signup."
- Fix alignment: all questions left-aligned, consistent padding

### 7. All CTAs and Pricing References

- Hero CTA: "Get Started" with "Rs. 499/month" below
- Pricing section: Keep as-is but remove "7-day free trial" line; change to "Start now"
- Footer CTA: "Get Started" (not "Start Your Free Trial")
- FAQ pricing answer: Updated

---

## Technical Implementation

### New Files
- `supabase/functions/generate-landing-images/index.ts` -- One-time edge function to generate ~12 app screenshot mockups and store them in the storage bucket

### Modified Files

| File | Changes |
|------|---------|
| `HeroSection.tsx` | Remove cartoon image, add phone-frame screenshot, fix CTA and pricing copy |
| `FeaturesGrid.tsx` | Replace CSS mockups with screenshot images for showcase features; add screenshot thumbnails to secondary feature cards and remaining primary cards |
| `PainPointsSection.tsx` | Replace cartoon images with professional gradient/icon visuals |
| `HowItWorks.tsx` | Remove AI illustration, fix step 1 text (no trial mention) |
| `FAQSection.tsx` | Redesign to clean full-width accordion, fix pricing FAQ, improve alignment |
| `PricingSection.tsx` | Remove trial language, update CTA to "Get Started", update subtext |
| `LandingFooter.tsx` | Fix CTA text from "Free Trial" to "Get Started" |

### Storage
- Create `landing-assets` public bucket
- Store ~12 generated screenshot images

### Image Generation Approach
- Use `google/gemini-2.5-flash-image` model to generate realistic UI mockups
- Each prompt will describe a specific app screen (e.g., "A mobile app screenshot showing a financial dashboard with Indian Rupee amounts, dark theme, showing project cards with margins")
- Images stored as PNG in the bucket, referenced by public URL in components

### Mobile Optimization
- All screenshots use `aspect-[9/16]` or `aspect-[3/4]` ratios for phone mockups
- Images lazy-loaded with `loading="lazy"`
- Secondary feature cards stack 2-wide on mobile with image thumbnails scaled to fit
- FAQ accordion is full-width with proper touch targets (min 44px tap area)

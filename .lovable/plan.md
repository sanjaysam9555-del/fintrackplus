

# Fix Landing Page: Logo Visibility, Mobile-First Hero, and Image Cropping

## Problem Summary
1. **No logo or app name visible** on first load -- hero section has no FinTrack+ branding
2. **On mobile, text is hidden below the fold** because the phone mockup takes `order-1` and pushes copy down
3. **Feature screenshot images are uncropped** -- full phone screenshots shown in tiny card thumbnails, making them unrecognizable

---

## Fix 1: Add Logo + App Name to Hero (Above the Fold)

Add the app icon (`src/assets/app-icon.png`) and "FinTrack+" name at the top of the hero section, visible immediately on load without any animation delay.

**File: `src/components/landing/HeroSection.tsx`**
- Import `appIcon` from `@/assets/app-icon.png`
- Add a logo + name row above the badge: a 36px icon + "FinTrack+" text, no stagger delay so it renders instantly
- This ensures branding is the first thing users see

## Fix 2: Mobile Layout -- Show Text First, Phone Second

Currently on mobile the phone mockup has `order-1` and text has `order-2`, meaning the key message is pushed below the fold.

**File: `src/components/landing/HeroSection.tsx`**
- Swap mobile order: text block gets `order-1` (always first on mobile), phone gets `order-2`
- Keep desktop layout unchanged (`md:order-1` for text, `md:order-2` for phone)
- Reduce `min-h-[85vh]` to `min-h-[70vh]` on mobile so the section doesn't take too much vertical space before content appears

## Fix 3: Crop Feature Card Screenshots to Show Relevant Portions

The issue is that full-height phone screenshots are crammed into small `h-36` / `h-28` card thumbnails using `object-cover object-top`. This always shows just the status bar area, which looks the same for every screenshot and is not meaningful.

**File: `src/components/landing/FeaturesGrid.tsx`**

### Remaining Features (card grid) -- Use `object-[center_top_offset]` to crop to the relevant part:

| Feature | Image | Crop Strategy |
|---|---|---|
| Vendor Management | `vendors.png` | `object-[center_25%]` -- show vendor list, not status bar |
| Cash vs Online Split | `home-tab.png` | `object-[center_15%]` -- show the balance cards |
| Receipt Capture | `expense-form.png` | `object-[center_40%]` -- show the receipt/camera area of the form |
| Smart Insights (AI) | `ai-summary.png` | `object-[center_20%]` -- show the charts/insights area |

### Secondary Features (small cards) -- Same approach with per-image crop positions:

| Feature | Image | Crop Position |
|---|---|---|
| Indian Financial Year | `income-tab.png` | `object-[center_10%]` -- show FY header |
| Recurring Transactions | `expense-tab.png` | `object-[center_20%]` |
| Duplicate Detection | `home-tab.png` | `object-[center_15%]` |
| Offline-First Sync | `home-tab.png` | `object-[center_15%]` |
| Global Search | `home-tab.png` | `object-[center_15%]` |
| Undo Delete | `activity-log.png` | `object-[center_20%]` |
| Custom Categories | `categories.png` | `object-[center_20%]` |
| Dark Mode + OLED | `ai-summary-2.png` | `object-[center_20%]` |

To implement this, add an `objectPosition` style property to each feature's data and apply it on the `<img>` tag instead of the generic `object-top`.

---

## Technical Details

### Files Changed

| File | Changes |
|---|---|
| `src/components/landing/HeroSection.tsx` | Add logo+name, fix mobile order (text first), reduce min-height |
| `src/components/landing/FeaturesGrid.tsx` | Add per-image `objectPosition` to remaining and secondary features, apply on img tags |

### No New Dependencies
All changes use existing imports and Tailwind utilities.


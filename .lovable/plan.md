

# Landing Page Revamp with Real App Screenshots

## Overview
Replace all placeholder `.jpg` screenshots with the 16 real app screenshots uploaded by the user. Revamp the hero section with a multi-phone carousel, add richer Framer Motion animations throughout, and map each screenshot to its relevant feature section.

## Step 1: Copy All 16 Images to Project Assets

Copy each uploaded image into `src/assets/landing/real/`:

| Source File | Destination |
|---|---|
| `Activity_Log.png` | `src/assets/landing/real/activity-log.png` |
| `Ai_Summary.png` | `src/assets/landing/real/ai-summary.png` |
| `Ai_Summary_2.png` | `src/assets/landing/real/ai-summary-2.png` |
| `Categories_Page.png` | `src/assets/landing/real/categories.png` |
| `Detailed_Project_Entries.png` | `src/assets/landing/real/project-entries.png` |
| `Detailed_Project_Sub_Tab.png` | `src/assets/landing/real/project-sub-tab.png` |
| `Detailed_Vendor_Payement_Entries.png` | `src/assets/landing/real/vendor-entries.png` |
| `Expense_Add_Form_1.png` | `src/assets/landing/real/expense-form.png` |
| `Expense_Tab.png` | `src/assets/landing/real/expense-tab.png` |
| `GST_Split_Transaction_Expense_Add_Form.png` | `src/assets/landing/real/gst-form.png` |
| `Home_Tab.png` | `src/assets/landing/real/home-tab.png` |
| `Income_Tab.png` | `src/assets/landing/real/income-tab.png` |
| `Partners_Page.png` | `src/assets/landing/real/partners.png` |
| `Projects_Tab.png` | `src/assets/landing/real/projects-tab.png` |
| `Reports_Page.png` | `src/assets/landing/real/reports.png` |
| `Vendors_Page.png` | `src/assets/landing/real/vendors.png` |

## Step 2: Revamp Hero Section (`HeroSection.tsx`)

Replace the single static phone mockup with an **auto-rotating carousel of 3 phones** using Embla Carousel (already installed):

- Show 3 key screens cycling: **Home Tab**, **Projects Tab**, **Expense Tab**
- Auto-play every 3 seconds with smooth crossfade transition
- Dot indicators below the phone frame
- Add a subtle floating animation (gentle up/down bob) on the phone frame using Framer Motion
- Add animated gradient orbs in the background that slowly drift
- Stagger the hero text entrance with spring physics for a snappier feel
- Add a subtle parallax tilt on the phone mockup using mouse position (desktop only)

### Hero Carousel Layout
```text
+---------------------------+     +------------------+
|  Stop Losing Money        |     |  [Phone Frame]   |
|  Between Weddings         |     |  +-----------+   |
|                           |     |  | Home Tab  |   |
|  The finance app Indian   |     |  | (auto-    |   |
|  wedding planners need... |     |  |  cycles)  |   |
|                           |     |  +-----------+   |
|  [Get Started] [Features] |     |   o  o  o        |
+---------------------------+     +------------------+
```

## Step 3: Image-to-Feature Mapping

### Showcase Features (alternating text + phone mockup)
| Feature | Screenshot |
|---|---|
| Wedding-as-a-Project | `projects-tab.png` + `project-entries.png` (mini carousel of 2) |
| Partner / Team Tracking | `partners.png` |
| Part Payment Tracking | `project-sub-tab.png` (shows installment/sub-tab detail) |
| GST Tagging and CA Export | `gst-form.png` + `reports.png` (mini carousel of 2) |

### Remaining Features (card grid with thumbnail)
| Feature | Screenshot |
|---|---|
| Vendor Management | `vendors.png` |
| Cash vs Online Split | `home-tab.png` |
| Receipt Capture | `expense-form.png` |
| Smart Insights (AI) | `ai-summary.png` |

### Secondary Features (small cards)
| Feature | Screenshot |
|---|---|
| Indian Financial Year | `income-tab.png` (shows FY 2025-26 header) |
| Recurring Transactions | `expense-tab.png` |
| Duplicate Detection | `home-tab.png` |
| Offline-First Sync | `home-tab.png` |
| Global Search | `home-tab.png` |
| Undo Delete | `activity-log.png` |
| Custom Categories | `categories.png` |
| Dark Mode + OLED | `ai-summary-2.png` |

## Step 4: Enhanced Animations

### Global Animation Improvements
- **Scroll-triggered reveals**: All sections use `whileInView` with staggered children (already partially done, will refine timing)
- **Spring physics**: Replace `ease` curves with `type: "spring"` for bouncier, more natural entrances on key elements
- **Scale-on-hover**: Feature cards grow slightly on hover with shadow elevation (`whileHover={{ scale: 1.03, y: -4 }}`)

### Hero-Specific Animations
- **Text entrance**: Each line staggers in with 0.12s delay, using spring physics
- **Phone float**: Continuous subtle `y: [0, -8, 0]` loop animation (3s repeat)
- **Background orbs**: Slow `x/y` drift animation on the gradient blobs (10s infinite)
- **Badge pulse**: The "Built for Indian Wedding Planners" badge has a subtle glow pulse

### Section-Specific Animations
- **Pain Points**: Cards slide in from left/right alternately instead of all from bottom
- **How It Works**: Step numbers count up (01, 02, 03) with a brief counter animation
- **Persona Section**: Cards fan out slightly on scroll entry

## Step 5: Mini Carousels for Multi-Screenshot Features

For features with 2+ screenshots (Wedding-as-a-Project, GST Export), create a small `PhoneCarousel` component:
- Uses Embla Carousel within the phone frame
- Auto-advances every 2.5 seconds
- Small dot indicators inside/below the phone
- Swipeable on mobile

## Files Changed

| File | Change |
|---|---|
| `src/assets/landing/real/` (new dir) | 16 new PNG screenshots |
| `src/components/landing/HeroSection.tsx` | Full rewrite: carousel of 3 phones, enhanced animations, floating effect |
| `src/components/landing/FeaturesGrid.tsx` | Update all screenshot imports to real PNGs, add PhoneCarousel for multi-image features, enhanced hover/scroll animations |
| `src/components/landing/PainPointsSection.tsx` | Add alternating slide-in animations |
| `src/components/landing/HowItWorks.tsx` | Add step number count animation |
| `src/components/landing/PersonaSection.tsx` | Add fan-out entrance animation |


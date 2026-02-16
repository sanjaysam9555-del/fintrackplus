

# Add Missing Features to Landing Page

## Problem
The landing page currently showcases ~16 features with screenshots, but the app has ~30 features total. About 14 features from the App Features Guide are missing from the landing page:

**Missing features:**
- Budgets and Margins, Partner Balances, Labels (Organize)
- Income and Expense logging (Track Money)
- Dashboard and Charts, Reports Export, Time Filters (Analyze)
- Duplicate Detection, Activity Log, Sort and Filter, Advanced Filters (Find and Fix)
- Profile, Cloud Sync, Offline Mode, Share Transactions, Install as App (Personalize)

## Approach
Add a new "Everything Else" section at the bottom of the features area (after the existing "And there's more" secondary grid). This section will use a clean, icon-driven layout -- no screenshots -- matching the landing page's existing card aesthetic.

The layout will be a tight 2-column (mobile) / 3-column (tablet) / 4-column (desktop) grid of compact icon cards. Each card has a colored icon circle, a bold title, and a one-line description. This keeps it scannable and visually consistent without needing images.

## Visual Design
- Section header: "30+ features. Zero complexity." with a subtitle
- Cards: Compact, minimal -- 40px colored icon circle, title, one-line description
- Card style: Same `bg-card/80 backdrop-blur-sm border ring-1 ring-primary/10` as existing landing cards
- Staggered entrance animations matching the rest of the page

## Technical Changes

### File: `src/components/landing/FeaturesGrid.tsx`

1. Import additional Lucide icons: `Tag`, `PlusCircle`, `TrendingUp`, `PiggyBank`, `Wallet`, `BarChart3`, `FileBarChart`, `Clock`, `Copy`, `Bell`, `ArrowDownUp`, `SlidersHorizontal`, `UserCircle`, `Cloud`, `WifiOff`, `Share2`, `Download`

2. Add a new `extraFeatures` array with the ~15 missing features, each having: icon, title, one-line description, and icon color class

3. Add a fourth section block after the existing secondary features section, rendering the extra features in a responsive grid of compact icon-and-text cards (no screenshots)

4. The section uses a clean header and the same motion animation patterns already in the file


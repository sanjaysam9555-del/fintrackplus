

# Redesign App Features Guide: Flowing Icon-Based Layout

## Overview
Replace the current screenshot-heavy feature guide with a clean, flowing, icon-driven design. No images -- just elegant cards with colorful icons, titles, and concise descriptions. Also expand the feature list to cover everything the app offers.

## Design Approach
- Remove all screenshot imports and the image overlay logic
- Each feature group gets a visually distinct header with a gradient accent
- Features within a group are rendered as compact pill/chip-style rows with colored icon circles -- no large cards, just a flowing list
- Add missing features: Notifications/Activity Log, Cloud Sync, Offline Mode, Onboarding, Sorting/Filtering, Time Filters, Cash Flow Charts, Share Transactions, Profile Customization, PWA/Install, Project Budgets and Margins, Partner Balances

## Updated Feature Groups

1. **Organize** -- Projects, Partners, Categories, Vendors, Labels, Project Budgets and Margins
2. **Track Money** -- Income and Expense Logging, Cash vs Online Split, Part Payments and Installments, GST Tagging, Recurring Transactions
3. **Analyze** -- Dashboard and Cash Flow Charts, AI Insights and Summaries, Reports Export (CSV/PDF), Financial Year View, Time Filters (Week/Month/Year/Custom)
4. **Find and Fix** -- Global Search, Duplicate Detection, Undo Delete, Activity Log and Notifications, Sort and Filter Transactions
5. **Personalize** -- Dark and OLED Mode, Receipt Capture, Profile Customization, Cloud Sync, Offline Mode, Share Transactions

## Technical Changes

### File: `src/components/settings/AppFeaturesGuide.tsx` (full rewrite)
- Remove all image imports (15 imports removed)
- Remove `expandedImage` state and the `AnimatePresence` overlay
- Remove the `screenshot` field from the `Feature` interface
- Expand the `featureGroups` array to ~28 features across 5 groups
- Add new Lucide icons: `BarChart3`, `Share2`, `Bell`, `CloudIcon`, `WifiOff`, `SlidersHorizontal`, `Clock`, `ArrowDownUp`, `TrendingUp`, `PiggyBank`, `Shield`
- Render each feature as a compact row: 36px icon circle + title + one-line description
- Group headers use a subtle gradient line accent for visual flow
- Staggered entrance animations remain for polish


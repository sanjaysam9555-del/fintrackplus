

# Fix Landing Page: Remove Duplicate Extra Features

## Problem
The "30+ features" section repeats features already showcased with screenshots above it: Budgets and Margins, Partner Balances, Income and Expense, Dashboard and Charts, Reports Export are all covered in the showcase/remaining/secondary sections. Sort and Filter + Advanced Filters are also two items for the same concept.

## Changes

### File: `src/components/landing/FeaturesGrid.tsx`

**Remove these 7 items from `extraFeatures`:**
- Budgets and Margins (covered in Projects showcase)
- Partner Balances (covered in Partners showcase)
- Income and Expense (implicit across the whole page)
- Dashboard and Charts (covered in AI Insights card)
- Reports Export (covered in GST/CA Export showcase)
- Sort and Filter (merge concept into Advanced Filters rename)
- Advanced Filters (keep one consolidated version)

**Keep and refine these 9 unique items:**
1. Labels -- color-coded tags for organizing projects
2. Time Filters -- filter by week, month, year, or custom range
3. Duplicate Detection -- smart warnings for similar entries
4. Activity Log -- full change history and notifications
5. Profile -- customize name and avatar
6. Cloud Sync -- data syncs across devices
7. Offline Mode -- works without internet
8. Share Transactions -- share details via any app
9. Install as App -- PWA, add to home screen

**Add 1 consolidated item to replace removed duplicates:**
- Sort, Filter and Search -- combine Sort and Filter + Advanced Filters into a single card: "Sort by date or amount, filter by category, vendor, project, and payment mode"

**Update section header** from "30+ features" to something like "Plus all the essentials" since the count is now lower and the framing should complement the detailed sections above rather than compete with them.

This brings the extra features grid to 10 compact cards -- all truly unique content not covered elsewhere on the page.


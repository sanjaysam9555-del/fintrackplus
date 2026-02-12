

# 6 Fixes: PDF Columns, Search Button, Quick Action Cards, Back Navigation, Vendor Payment Tracking, and Uncategorized Filter

## 1. PDF Expense Column Optimization

**Problem**: The PDF table has 12 columns (Date, Time, Title, Type, Vendor, Category, Project, Partner, Amount, Payment, GST, Notes) all cramped together. The "expense" data (type, amount) isn't given enough visual weight.

**Fix** in `src/components/settings/ReportsSection.tsx`:
- Assign explicit column widths using `<colgroup>` or `style="width:..."` on `<th>` elements
- Give Amount column more width (`width: 10%`) and make it right-aligned with bold text
- Reduce Time column to just show time without seconds
- Merge Date and Time into a single "Date/Time" column to free up space
- Give Notes column a `max-width: 120px` with ellipsis
- Reduce font-size of table to `11px` and header to `9px` for better fit at 1100px width
- Add `table-layout: fixed` so column widths are respected

## 2. Search Button on Income and Expense Tabs

**Problem**: The Search icon button exists on the Home tab header but not on Income/Expense tab headers. The search bar at line 456-465 of `TransactionList.tsx` exists but is a full-width bar, not the icon button style from Home.

**Fix** in `src/components/TransactionList.tsx`:
- Add a Search icon button next to the Settings button in the header (line 278-289)
- Place it before the Settings button: `[Title] ... [Search] [Settings]`
- Use the same `onSearchClick` prop that's already accepted by the component

## 3. Reduce Height of Quick Action Cards (Categories, Vendors, Projects, Reports)

**Problem**: The quick action cards on the Home tab use `flex-col` layout with icon on top and label below, plus `p-3 lg:p-4` padding, making them tall.

**Fix** in `src/components/Dashboard.tsx` (lines 698-714):
- Change from `flex-col` to `flex-row` (horizontal layout): icon and label side by side
- Reduce padding from `p-3 lg:p-4` to `p-2.5 lg:p-3`
- Reduce icon container from `w-8 h-8 lg:w-10 lg:h-10` to `w-7 h-7 lg:w-8 lg:h-8`
- Change gap from `gap-1.5 lg:gap-2` to `gap-2`
- Remove `items-center` centering and use `items-center` for row alignment instead
- Keep label text size the same

## 4. Back Button Returns to Home When Navigated from Home

**Problem**: When clicking Categories/Vendors/Projects/Reports from the Home tab, `handleNavigate` in `Index.tsx` sets `viewMode='settings'` with `settingsSection`. The sub-section's back button calls `handleBack` in `SettingsPage.tsx` which sets `activeSection=null`, showing the Settings main page instead of returning to Home.

**Fix**: Track whether the user came from Home or from Settings.

In `src/pages/Index.tsx`:
- Add a `navigatedFromHome` ref/state that gets set to `true` when `handleNavigate` is called with a section key (categories, vendors, projects, reports) and `viewMode` is currently not 'settings'
- Pass a new `onBackToHome` prop to `SettingsPage`

In `src/components/SettingsPage.tsx`:
- Accept an `onBackToHome` callback prop
- When `initialSection` is set (meaning we arrived directly at a sub-section), the sub-section's `onBack` should call `onBackToHome` instead of `handleBack` (which shows Settings main)
- Track whether we arrived via `initialSection` vs navigated within Settings

## 5. Vendor Payment Tracking (History and Projects)

**Problem**: The VendorsSection only shows vendor names with edit/delete. No payment history or project associations are visible.

**Fix** in `src/components/settings/VendorsSection.tsx`:
- Add a clickable vendor row that expands (or opens a detail view) showing:
  - **Total paid**: sum of all transactions with that vendor
  - **Transaction count**: number of transactions
  - **Projects worked on**: list of unique projects from transactions with that vendor
  - **Recent transactions**: last 5 transactions with date, amount, project name
- Use an expandable/collapsible section (click vendor row to toggle)
- Compute this data using `useMemo` from the existing `transactions` array in the store
- Add a small summary line under each vendor name showing "X transactions | Total: amount"

## 6. Uncategorized Filter in Income and Expense Tabs

**Problem**: No way to filter for entries missing a vendor or project.

**Fix** in `src/components/TransactionList.tsx`:
- Add filter chips alongside the existing category chips (line 468-496)
- Add an "Uncategorized" chip that filters for transactions where `categoryId` is null/empty
- Add a "No Project" chip that filters for transactions where `projectId` is null/empty  
- Add a "No Vendor" chip that filters for transactions where `vendor` is empty or default
- These are toggle filters that can be combined with the existing category filter
- Add state: `const [uncategorizedFilter, setUncategorizedFilter] = useState<string | null>(null)` with values like `'no-category'`, `'no-project'`, `'no-vendor'`
- Apply the filter in the `sortedTransactions` useMemo

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/settings/ReportsSection.tsx` | Merge Date/Time columns, add `table-layout: fixed`, assign explicit column widths, reduce font sizes |
| `src/components/TransactionList.tsx` | Add Search icon button to header; add uncategorized/no-project/no-vendor filter chips |
| `src/components/Dashboard.tsx` | Change quick action cards from vertical to horizontal layout, reduce padding and icon size |
| `src/pages/Index.tsx` | Track `navigatedFromHome` state; pass `onBackToHome` to SettingsPage |
| `src/components/SettingsPage.tsx` | Accept `onBackToHome` prop; use it when `initialSection` is set and user clicks back |
| `src/components/settings/VendorsSection.tsx` | Add expandable vendor details: total paid, transaction count, projects list, recent transactions |


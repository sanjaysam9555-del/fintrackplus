
# Clickable Project Filter Chips on Vendor Detail Page

## What Changes

On the vendor detail page, the project chips at the top become clickable toggle filters. Tapping a project chip highlights it with color and filters the transaction list to show only entries from that project. Multiple projects can be selected simultaneously. When no chips are selected, all transactions show (default).

## Technical Details

**File: `src/components/settings/VendorsSection.tsx`**

1. **Add state** for selected project filter:
   - `const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set())`
   - Reset it when `detailVendorName` changes

2. **Make project chips clickable** (lines 282-287):
   - Toggle project ID in/out of `selectedProjectIds` on click
   - When selected: apply the project's color as background with white text (or use `bg-primary text-primary-foreground`)
   - When unselected: keep current `bg-muted` style
   - Add `cursor-pointer` and transition classes

3. **Filter transactions** (lines 296-304):
   - Compute `filteredTransactions` from `detailStats.all`:
     - If `selectedProjectIds.size === 0` -> show all
     - Otherwise -> show only transactions where `t.projectId` is in `selectedProjectIds`
   - Update the transaction count/total in the header card to reflect the filtered view

4. **Add "All" chip** before the project chips to quickly clear all filters (deselect all projects)

| Element | Unselected | Selected |
|---------|-----------|----------|
| Project chip | `bg-muted text-foreground` | `bg-primary text-primary-foreground` or project color |
| "All" chip | Active when no projects selected | Dimmed when projects are selected |

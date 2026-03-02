

# Convert Project Detail from Drawer to Full Page

## Overview
Replace the bottom drawer (`ProjectDetailSheet`) with a full-page view that renders inline within the Projects tab. This gives more room for content and allows adding new fields like event date and start date. The income/expense sections will default to collapsed with sum totals visible, documents will move above income, and document thumbnails will be shown for image files.

## Changes

### 1. Add Date Fields to Project Model

**Database migration**: Add `event_date` and `start_date` columns to the `projects` table.

```sql
ALTER TABLE public.projects 
  ADD COLUMN event_date date DEFAULT NULL,
  ADD COLUMN start_date date DEFAULT NULL;
```

**File: `src/lib/types.ts`** -- Add `eventDate?: string` and `startDate?: string` to the `Project` interface.

**File: `src/lib/store.ts`** -- Update project mapping to include the new date fields when reading/writing to the database.

**File: `src/components/ProjectOverviewPage.tsx`** -- Add date inputs to the Add/Edit project forms.

### 2. Convert ProjectDetailSheet from Drawer to Inline Full Page

**File: `src/components/ProjectDetailSheet.tsx`** (renamed conceptually to `ProjectDetailPage`):

- Remove the `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle` wrapper
- Replace with a full-page `div` that fills the parent container with its own scroll area
- Add a sticky header with a back arrow button (calls `onClose`) and project name
- The page renders inside the existing Projects tab area (no route change needed)

**File: `src/components/ProjectOverviewPage.tsx`**:

- When `selectedProject` is set, render `ProjectDetailPage` instead of the project list
- Pass an `onBack` callback that sets `selectedProject` back to `null`
- The `ProjectDetailSheet` Drawer import is replaced with the new inline component

### 3. Layout of the Full Page

The page will have this structure (top to bottom):

1. **Sticky Header**: Back arrow + Project name + Search icon
2. **Project Info Card**: Description, event date, start date, created date, labels
3. **Financial Summary**: Existing 2x2 grid (Cost to Client, Income, Expenses, Net Margin)
4. **Project Notes**: Existing textarea with save button
5. **Documents Section** (moved up, always visible -- not collapsed by default):
   - Upload button
   - Document list with thumbnail previews for images
   - For image files (`fileType.startsWith('image/')`) show the actual image as a small thumbnail (48x48 rounded) instead of just an icon
   - Non-image files keep the existing icon treatment
6. **Income Entries** (collapsed by default):
   - Collapsible section header shows count and total sum: "Income (3) -- Rs 50,000"
   - Sum is displayed at the trailing edge of the collapse trigger
   - `defaultOpen={false}` -- always starts minimized
7. **Expense Entries** (collapsed by default):
   - Same pattern as income: "Expenses (5) -- Rs 30,000"
   - Collapsed by default with sum visible
8. **Vendor Breakdown**: Existing collapsible vendor payment groups

### 4. Collapsible Income/Expense with Sum

Replace the current always-open lists with `Collapsible` components:

```text
+-----------------------------------------------+
| v  Income Entries (3)           Rs 50,000    |
+-----------------------------------------------+
|   (collapsed -- entries hidden by default)     |
+-----------------------------------------------+
```

The sum is calculated from `incomeTransactions.reduce((s, t) => s + t.amount, 0)` and displayed in the trigger row using `formatCurrency`.

### 5. Document Thumbnails

For image documents, replace the generic icon with an actual `<img>` thumbnail:

```text
+--[ img thumb ]--+  contract-photo.jpg
|                 |  1.2 MB · Mar 1, 2026
+-----------------+  [open] [delete]
```

- Use the existing `doc.fileUrl` as the `src`
- Add `object-cover` styling on a 48x48 rounded container
- Non-image files continue using the existing icon-based display

### 6. Project Info Section (New)

Display project metadata below the header:

- **Event Date**: formatted date or "Not set"
- **Start Date**: formatted date or "Not set"  
- **Created**: from `project.createdAt`
- **Labels**: existing label chips

## Files Modified

| File | Change |
|------|--------|
| `src/components/ProjectDetailSheet.tsx` | Rewrite from Drawer to full-page component; reorder sections; add collapsible income/expense with sums; add thumbnail previews; add date display |
| `src/components/ProjectOverviewPage.tsx` | Conditionally render detail page instead of list; add date inputs to add/edit forms |
| `src/lib/types.ts` | Add `eventDate` and `startDate` to Project interface |
| `src/lib/store.ts` | Map new date fields in project CRUD operations |
| Database migration | Add `event_date` and `start_date` columns to `projects` table |

## Technical Notes

- No new routes needed -- the detail page renders conditionally inside the Projects tab view
- The `isOpen`/`onClose` prop pattern stays the same but now controls visibility of the inline page vs the project list
- The `onEditSheetChange` callback continues to work for transaction editing within the detail page
- Image thumbnails use the signed URL already stored in `doc.fileUrl` with an `onError` fallback to the icon


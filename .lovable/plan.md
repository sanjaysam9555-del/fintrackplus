

# Project Detail Page Enhancements

## Overview
Three changes to the project detail page: (1) make vendor payments collapsible like income/expense, (2) add an edit button to set dates from the detail page, and (3) add in-app document preview.

## Changes

### 1. Vendor Payments -- Match Income/Expense Collapsible Style

**File: `src/components/ProjectDetailSheet.tsx`**

The current vendor payments section (lines 533-595) uses a heading "Vendor Payments" followed by individually expandable vendor rows. This will be changed to wrap the entire section in a single top-level `Collapsible` (collapsed by default), matching the income/expense pattern:

- Add `vendorsOpen` state (default `false`)
- Replace the current `<h3>Vendor Payments</h3>` heading with a collapsible trigger button styled identically to income/expense triggers
- Trigger shows: `Store` icon + "Vendor Payments ({vendorBreakdown.length})" on the left, total vendor spend on the right
- The individual vendor rows inside remain expandable as they are now
- Total vendor amount: `vendorBreakdown.reduce((s, v) => s + v.amount, 0)`

### 2. Edit Project from Detail Page (with Date Fields)

**File: `src/components/ProjectDetailSheet.tsx`**

Add a `Pencil` (edit) icon button in the sticky header next to the search button. Tapping it opens an inline edit form (or a sheet) within the detail page that includes:

- Project name, description, color picker
- **Event Date** -- date input field
- **Start Date** -- date input field
- Cost to Client, labels
- Save / Cancel buttons

Implementation:
- Add `isEditing` state and `editForm` state (pre-populated from `project`)
- The edit form replaces the Project Info Card area when active
- Date inputs use native `<input type="date">` for cross-platform compatibility
- On save, call `updateProject(project.id, { ...editForm }, userId)` and close the edit mode
- The `selectedProject` in `ProjectOverviewPage` needs to be refreshed after update -- this already works since the store is reactive via Zustand

### 3. In-App Document Preview

**File: `src/components/ProjectDetailSheet.tsx`**

Currently, clicking the external link icon opens documents in a new tab. Add an in-app preview overlay:

- Add `previewDoc` state (`ProjectDocument | null`)
- When tapping a document row (or a new "eye" icon), set `previewDoc` to that document
- Render a full-screen overlay (`fixed inset-0 z-50 bg-background`) with:
  - Header: back button + file name
  - For **images**: render `<img src={doc.fileUrl} className="max-w-full max-h-full object-contain" />`
  - For **PDFs**: render `<iframe src={doc.fileUrl} className="w-full h-full" />`
  - For **other files**: show a message "Preview not available" with a link to open externally
- Tapping the back button or overlay background closes the preview

## Files Modified

| File | Change |
|------|--------|
| `src/components/ProjectDetailSheet.tsx` | Wrap vendor payments in collapsible; add edit mode with date inputs; add document preview overlay |

## Technical Notes

- No database changes needed -- `event_date` and `start_date` columns and store mapping already exist
- The edit form reuses the existing `updateProject` store action which already handles `eventDate` and `startDate`
- Document preview works with signed URLs already stored in `doc.fileUrl`
- PDF preview via iframe works on most modern browsers; falls back to external link on unsupported browsers


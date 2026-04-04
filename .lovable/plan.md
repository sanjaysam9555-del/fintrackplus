

## All Documents Section in Settings

### Summary
Create a new "All Documents" section in Settings that aggregates project documents and transaction receipts into one unified view, with project-based grouping, an unassigned section, and a toggle for flat grid view.

### Data Sources
1. **Project Documents** — from `project_documents` table (uploaded via ProjectDetailSheet)
2. **Transaction Receipts** — from `transactions` table where `receipt_url` is not null

### New File: `src/components/settings/AllDocumentsSection.tsx`

This component will:

1. **Fetch all project documents** from `project_documents` table (org-scoped via RLS)
2. **Fetch all transactions with receipts** — query `transactions` where `receipt_url IS NOT NULL`
3. **Group by project**:
   - For each project, show a collapsible section with project name/color
   - Inside: project documents + receipts from transactions assigned to that project
   - Each item shows thumbnail (image preview for images, file icon for others), file name, date, size
4. **Unassigned section**:
   - Receipts from transactions with no `project_id`
   - Project documents with no matching project (edge case)
5. **Toggle: "Show All"** — a switch at the top that flattens everything into a single thumbnail grid (no sections/grouping), sorted by date descending
6. **Thumbnail grid**: 3-4 columns on mobile, 5-6 on desktop. For image types (jpg/png/webp), show the image as thumbnail. For PDFs/other files, show a file-type icon with the filename below.

### Integration into SettingsPage

- Add `'documents'` to the `SettingsSection` type union
- Add a menu item under "Data Management" with `FileText` icon, label "All Documents", sublabel showing total count
- Add the section render block like other sections
- Visible to owners and admins only

### Files Changed
| File | Change |
|---|---|
| `src/components/settings/AllDocumentsSection.tsx` | New component — full documents hub |
| `src/components/SettingsPage.tsx` | Add 'documents' section type, menu item, and render block |

### Technical Details
- Queries use existing RLS policies (org-scoped) — no migrations needed
- Receipts are in the private `receipts` bucket; project docs in `project-documents` bucket — both use signed URLs already stored in DB
- The toggle switch uses the existing `Switch` UI component
- Thumbnails: for `image/*` types, render `<img>` with `object-cover`; for others, render a styled icon based on file extension




# App Enhancement Plan: Documents, Installment Reminders, and Category Details

## Feature 1: Project Documents System

### Overview
Add the ability to attach documents (contracts, invoices, etc.) to projects, and provide a "Documents" section to browse all project files.

### Database Changes
- Create a `project_documents` table: `id`, `user_id`, `project_id`, `file_name`, `file_url`, `file_type`, `file_size`, `uploaded_at`
- RLS policies scoped to `user_id`
- Create a `project-documents` storage bucket (private, with user-scoped RLS)

### UI Changes

**Project Detail Sheet (`ProjectDetailSheet.tsx`)**
- Add a "Documents" collapsible section below the existing vendor breakdown
- Upload button that opens file picker (accepts PDF, images, DOCX, etc.)
- Files uploaded to the `project-documents` storage bucket
- Each document shown as a card with file name, type icon, size, and date
- Tap to open/download, swipe or long-press to delete

**Settings > Projects (`ProjectsSection.tsx` and `ProjectOverviewPage.tsx`)**
- Show document count on project cards (e.g., "3 documents")

**No separate "Documents" tab** initially -- documents live inside their project's detail sheet, keeping things simple and contextual. A global "Documents" view can be added later if needed.

### Technical Details
- Upload flow: file picker -> upload to `project-documents` bucket -> insert row in `project_documents` table -> display in list
- Store actions: `addProjectDocument`, `deleteProjectDocument`, fetch documents per project
- Sync engine: add `project_documents` to cloud sync and realtime subscriptions

---

## Feature 2: Installment Due Date Reminders

### Overview
When the app opens (or on the dashboard), check for any planned installments whose `expectedDate` matches today (or is overdue). Show a prominent reminder dialog/banner so the user can quickly mark them as received.

### No Database Changes Needed
Installment data already exists in `planned_installments` JSONB on transactions.

### UI Changes

**New Component: `InstallmentDueReminder.tsx`**
- On dashboard load, scan all transactions with `isPartPayment = true` and `plannedInstallments` containing entries where `status = 'pending'` and `expectedDate <= today`
- Display a modal/dialog listing each due installment:
  - Transaction title/vendor
  - Installment amount and expected date
  - "Mark as Received" button (calls existing `confirmInstallment` store action)
  - "Remind Later" / dismiss option
- After confirming, the installment is marked received (same logic already in `PartPaymentTracker`)

**Dashboard (`Dashboard.tsx`)**
- Render `InstallmentDueReminder` at the top of the dashboard
- Show a subtle banner if there are due installments, tapping opens the full reminder dialog
- Works for both income and expense installments

### Technical Details
- Uses existing `confirmInstallment` from the store -- no new store actions needed
- Filter logic: `transaction.plannedInstallments.filter(i => i.status === 'pending' && i.expectedDate <= format(today, 'yyyy-MM-dd'))`
- Dismissed reminders tracked in local state (session-level, reappears next session)

---

## Feature 3: Category Detail View (like Vendors)

### Overview
In Settings > Categories, tapping a category card opens a detail page showing all transactions under that category, with project filter chips -- matching the existing Vendors detail view pattern.

### No Database Changes Needed
Transaction data already references `categoryId`.

### UI Changes

**Categories Section (`CategoriesSection.tsx`)**
- Add a `detailCategoryId` state (same pattern as `detailVendorName` in VendorsSection)
- Category cards become tappable (chevron indicator)
- Tapping opens a detail view with:
  - Category header (icon, color, name, type badge)
  - Transaction count and total amount
  - Income/Expense segmented filter (since a category is typed, but we show all matching entries)
  - Project filter chips (same as vendors)
  - Scrollable list of transactions using `TransactionItem` component
- Edit and Delete buttons remain accessible from the detail view header
- Back button returns to category list

### Technical Details
- Compute `categoryStats` from transactions (total, count, projectIds, all transactions) -- same pattern as `vendorStats` in VendorsSection
- Reuse `TransactionItem` component for rendering entries
- Add `onEditSheetChange` prop support for nested edit sheets
- Project filter chips use the same toggle pattern as VendorsSection

---

## Implementation Order

1. **Category Detail View** -- smallest scope, no DB changes, follows existing vendor pattern exactly
2. **Installment Due Reminders** -- no DB changes, new component wired into Dashboard
3. **Project Documents** -- requires new table, storage bucket, and upload UI

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/settings/CategoriesSection.tsx` | Add detail view with transaction list |
| `src/components/InstallmentDueReminder.tsx` | New -- due installment dialog |
| `src/components/Dashboard.tsx` | Add InstallmentDueReminder |
| `supabase/migrations/` | New migration for `project_documents` table + storage bucket |
| `src/lib/store.ts` | Add document CRUD actions |
| `src/lib/syncEngine.ts` | Add document sync |
| `src/components/ProjectDetailSheet.tsx` | Add documents section with upload |


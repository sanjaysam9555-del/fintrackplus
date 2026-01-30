
# Fix Project Transaction Tracking & Add Project Notes

## Summary of Issues Found

After investigating the codebase and database, I found the root causes of the problem:

**Issue 1: Income transactions are excluded from project views**
- `ProjectOverviewPage.tsx` line 61 filters transactions to only show expenses: `t.type === 'expense'`
- `getProjectSpending()` in store also only calculates expense totals
- Projects with income entries (like "Nikunj Kanika" with 930,000 in income) don't reflect those entries

**Issue 2: Transactions not sorted by date (descending)**
- The current display in `ProjectDetailSheet.tsx` doesn't explicitly sort by date before rendering

**Issue 3: Projects lack a notes field**
- The `Project` interface only has `description` - no separate notes field for ongoing project notes
- The database `projects` table also doesn't have a notes column

---

## Solution Overview

```text
BEFORE                              AFTER
┌────────────────────────────┐     ┌────────────────────────────────────┐
│ Project Card               │     │ Project Card                       │
│ ├─ Budget                  │     │ ├─ Budget                          │
│ ├─ Spent (expenses only)   │     │ ├─ Total Income (NEW)              │
│ └─ Margin                  │     │ ├─ Total Expenses (NEW)            │
│                            │     │ ├─ Net (income - expense)          │
│ Detail Sheet               │     │ └─ Margin Health                   │
│ ├─ Only expenses shown     │     │                                    │
│ └─ No notes                │     │ Detail Sheet                       │
│                            │     │ ├─ ALL transactions (sorted desc)  │
└────────────────────────────┘     │ ├─ Income section                  │
                                   │ ├─ Expense section                 │
                                   │ ├─ Vendor breakdown                │
                                   │ └─ Project Notes (editable, synced)│
                                   └────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Add Notes Column to Projects Table

Add a new `notes` column to the `projects` table in the database for project-level notes.

```sql
ALTER TABLE projects ADD COLUMN notes TEXT;
```

### Step 2: Update TypeScript Types

Update the `Project` interface to include the new notes field:

```typescript
// src/lib/types.ts
export interface Project {
  // ... existing fields
  notes?: string;  // NEW: project-level notes
}
```

### Step 3: Update Store & Cloud Sync

**src/lib/store.ts**:
- Add new helper `getProjectIncome(projectId)` to calculate total income for a project
- Update `updateProject` to handle the `notes` field

**src/hooks/useCloudSync.ts**:
- Map `notes` field when syncing projects from cloud

### Step 4: Fix ProjectOverviewPage.tsx

Update to show both income and expenses:

1. Create `getProjectIncome()` helper alongside existing `getProjectSpending()`
2. Update `getProjectTransactions()` to include ALL transaction types (not just expenses)
3. Show Income and Expense totals separately in the project cards
4. Calculate Net = Income - Expenses for proper margin analysis

**New Stats Grid**:
```text
┌─────────┬─────────┐
│ Budget  │ Income  │
├─────────┼─────────┤
│ Expense │ Net     │
└─────────┴─────────┘
```

### Step 5: Fix ProjectDetailSheet.tsx

Major updates needed:

1. **Accept ALL transactions** (not pre-filtered):
   - Remove expense-only filtering from props
   - Let the component handle separation internally

2. **Sort transactions by date descending**:
   - `transactions.sort((a, b) => new Date(b.date) - new Date(a.date))`

3. **Show Income section** alongside Expense section:
   - Green for income entries, red for expense entries

4. **Update Vendor Breakdown** to separate income vs expense vendors

5. **Add editable Notes section**:
   - TextArea for project notes
   - Auto-save with debounce to cloud
   - Show timestamp of last edit

**New Detail Sheet Layout**:
```text
┌─────────────────────────────────────┐
│ 📁 Project Name                     │
│ Description text                    │
├─────────────────────────────────────┤
│ Financial Summary                   │
│ ┌─────────┬─────────┐               │
│ │ Budget  │ Income  │               │
│ ├─────────┼─────────┤               │
│ │ Expense │ Net     │               │
│ └─────────┴─────────┘               │
├─────────────────────────────────────┤
│ 📝 Project Notes                    │
│ ┌─────────────────────────────────┐ │
│ │ Editable textarea...            │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 💰 Income Entries (X)               │
│ ├─ Date: Jan 26 - Vendor - ₹440K   │
│ └─ Date: Jan 22 - Vendor - ₹440K   │
├─────────────────────────────────────┤
│ 💸 Expense Entries (Y)              │
│ ├─ Date: Jan 30 - Vendor - ₹10K    │
│ └─ Date: Jan 29 - Vendor - ₹7.5K   │
├─────────────────────────────────────┤
│ 🏪 Vendor Breakdown                 │
│ └─ Vendor payments grouped          │
└─────────────────────────────────────┘
```

### Step 6: Update ProjectsSection Settings

Update `src/components/settings/ProjectsSection.tsx`:
- Add notes field to the edit form
- Show notes textarea below description

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Add `notes?: string` to Project interface |
| `src/lib/store.ts` | Add `getProjectIncome()` helper, update `updateProject` for notes |
| `src/hooks/useCloudSync.ts` | Map `notes` field when syncing projects |
| `src/components/ProjectOverviewPage.tsx` | Show both income/expenses, fix transaction filtering |
| `src/components/ProjectDetailSheet.tsx` | Major refactor: show all transactions, add notes editor, sort by date |
| `src/components/settings/ProjectsSection.tsx` | Add notes field to project form |

**Database Migration**:
- Add `notes` column to `projects` table

---

## Technical Notes

1. **Date Sorting**: Use `new Date(b.date).getTime() - new Date(a.date).getTime()` for reliable descending sort

2. **Notes Auto-Save**: Implement debounced save (500ms delay) to prevent excessive API calls while typing

3. **Cloud Sync**: Notes are synced via the existing project update mechanism - no new sync logic needed

4. **Backward Compatibility**: The notes field is optional, so existing projects will continue to work


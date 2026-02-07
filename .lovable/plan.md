
# Project Cards Menu, Portfolio Overview Filter, and Transaction Detail Fixes

## Overview

This plan addresses three issues:
1. Replace the archive button on project cards with a three-dot menu containing Close, Duplicate, and Archive options
2. Make the Portfolio Overview section filter based on active/archived tab selection
3. Fix the Edit button in the transaction detail sheet that does nothing when clicked

---

## Issue Analysis

### Issue 1: Three-Dot Menu on Project Cards
Currently in `ProjectOverviewPage.tsx`, each project card has a dedicated archive button (lines 329-355). This needs to be replaced with a dropdown menu containing:
- **Close** - Same as archive functionality
- **Duplicate** - Create a copy of the project
- **Archive/Restore** - Toggle archive status

### Issue 2: Portfolio Overview Not Filtering
The Portfolio Overview section (lines 116-147) calculates totals only for `activeProjects`, but this should change based on the selected tab:
- When "Active" tab is selected, show totals for active projects
- When "Archived" tab is selected, show totals for archived projects

### Issue 3: Edit Button in TransactionDetailSheet
Looking at `TransactionDetailSheet.tsx`, the Edit button at line 241-248 sets `isEditing(true)`, which should open the `EditTransactionSheet` (lines 264-271). However, the `TransactionDetailSheet` has a z-index of `z-[70]` while the `EditTransactionSheet` uses `z-[60]`. This means the edit sheet renders BEHIND the detail sheet, making it appear like nothing happens.

Additionally, the transaction data passed to EditTransactionSheet might become stale if the transaction was updated elsewhere, causing issues.

---

## Technical Implementation

### File 1: `src/components/ProjectOverviewPage.tsx`

**1. Import DropdownMenu components and new icons:**
```tsx
import { MoreVertical, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

**2. Add duplicate project handler:**
```tsx
const [duplicateProject, setDuplicateProject] = useState<Project | null>(null);

const handleDuplicate = (project: Project) => {
  const { addProject } = useFinanceStore.getState();
  addProject({
    name: `${project.name} (Copy)`,
    description: project.description,
    notes: project.notes,
    budgetLimit: project.budgetLimit,
    margin: project.margin || 0,
    color: project.color,
  }, userId);
  toast.success(`Project "${project.name}" duplicated`);
};
```

**3. Update Portfolio Overview to filter by tab (lines 54-58):**
```tsx
// Calculate totals based on selected tab
const relevantProjects = showArchived ? archivedProjects : activeProjects;
const totalBudget = relevantProjects.reduce((sum, p) => sum + p.budgetLimit, 0);
const totalMargin = relevantProjects.reduce((sum, p) => sum + (p.margin || 0), 0);
const totalSpent = relevantProjects.reduce((sum, p) => sum + getProjectSpending(p.id), 0);
```

**4. Update Portfolio Overview header to indicate context (line 120):**
```tsx
<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
  {showArchived ? 'Archived' : 'Active'} Portfolio
</p>
```

**5. Replace Archive button with Three-Dot Menu (lines 329-355):**
Replace the current archive button with:
```tsx
{/* Three-Dot Menu */}
<div className="px-3 pb-3 flex justify-end">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        onClick={(e) => e.stopPropagation()}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <MoreVertical size={18} className="text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-44">
      <DropdownMenuItem 
        onClick={(e) => {
          e.stopPropagation();
          handleDuplicate(project);
        }}
        className="gap-2"
      >
        <Copy size={14} />
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={(e) => {
          e.stopPropagation();
          setArchiveProject(project);
        }}
        className="gap-2"
      >
        {project.archived ? (
          <>
            <ArchiveRestore size={14} />
            Restore
          </>
        ) : (
          <>
            <Archive size={14} />
            Archive
          </>
        )}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

---

### File 2: `src/components/TransactionDetailSheet.tsx`

**Fix z-index issue so EditTransactionSheet appears above TransactionDetailSheet:**

The issue is that `TransactionDetailSheet` uses `z-[70]` but `EditTransactionSheet` uses `z-[60]`. The edit sheet renders behind the detail sheet.

**Solution: Close the detail sheet when opening edit mode**

Update the Edit button handler to close the detail sheet first, then open the edit sheet:

```tsx
const handleEditClick = () => {
  // Close the detail sheet first
  onClose();
  // Small delay to allow detail sheet to close, then open edit
  setTimeout(() => setIsEditing(true), 100);
};
```

But this creates a problem - if we close onClose(), we lose the transaction reference.

**Better solution: Keep transaction reference and close detail sheet during edit**

1. Add a prop to control external edit handling
2. Pass the transaction back to parent for editing

**Alternative approach - Simplest fix:**
Raise the z-index of EditTransactionSheet when opened from TransactionDetailSheet, OR close the TransactionDetailSheet backdrop while editing:

```tsx
// Update the component to hide the detail sheet while editing
<AnimatePresence>
  {isOpen && !isEditing && (
    <>
      {/* Backdrop and Sheet content */}
    </>
  )}
</AnimatePresence>
```

This ensures the detail sheet is hidden while editing, allowing the edit sheet to be visible and interactive.

**Additionally, refresh transaction data after edit:**
Add a way to get the latest transaction from the store after edits.

```tsx
// Get fresh transaction data from store
const { transactions } = useFinanceStore();
const currentTransaction = transactions.find(t => t.id === transaction?.id) || transaction;
```

---

### File 3: `src/components/EditTransactionSheet.tsx` (Optional Enhancement)

Currently, the EditTransactionSheet uses z-index of `z-[60]`. This should work fine if we hide the TransactionDetailSheet during editing (as proposed above).

However, if we want both sheets visible (for reference), we'd need to increase the z-index here. The simplest fix is the approach in File 2.

---

## Files Summary

| File | Changes |
|------|---------|
| `src/components/ProjectOverviewPage.tsx` | Add three-dot menu with Duplicate/Archive options; Filter Portfolio Overview by tab |
| `src/components/TransactionDetailSheet.tsx` | Hide detail sheet while editing to allow edit sheet to be interactive |

---

## User Experience After Changes

### Project Card Menu
- Each project card will have a three-dot icon in the bottom-right
- Clicking it reveals: Duplicate, Archive (or Restore for archived projects)
- "Close" is functionally the same as Archive, so we use "Archive" as the action name

### Portfolio Overview
- When "Active" tab is selected: Shows Budget/Spent/Margin for active projects only
- When "Archived" tab is selected: Shows Budget/Spent/Margin for archived projects only
- Header changes to indicate "Active Portfolio" or "Archived Portfolio"

### Transaction Detail Edit
- Clicking "Edit" in the transaction detail sheet will hide the detail sheet
- The edit sheet slides up and is fully interactive
- After saving/closing the edit sheet, user returns to the main view (not back to detail sheet)

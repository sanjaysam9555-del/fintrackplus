

# Fix: Labels in Projects Tab Add Form + Label Badges on Project Cards

## Problem
The label picker and label badges were only added to `ProjectsSection.tsx` (Settings > Projects), but the main **Projects tab** uses a completely separate component -- `ProjectOverviewPage.tsx` -- which has its own add form and project cards that were never updated.

## Changes

### 1. `src/components/ProjectOverviewPage.tsx` -- Add Form

- Add `labelIds: []` to `formData` state
- Add `projectLabels`, `addProjectLabel` to the store destructuring
- Add a label chip picker + inline "+ New label" input below the color selector (same pattern as `ProjectsSection.tsx`)
- Pass `labelIds` when calling `addProject()`

### 2. `src/components/ProjectOverviewPage.tsx` -- Project Cards

- After the project name and health dot, render label badges (small colored pills with `#name`) when `Array.isArray(project.labelIds) && project.labelIds.length > 0`
- Pull `projectLabels` from the store to resolve label names/colors

### 3. `src/components/settings/ProjectsSection.tsx` -- Verify Label Rendering

- The `Array.isArray` guard was already added in the last fix. Confirm labels render on project cards in Settings as well. The existing code at line 333 already handles this correctly.

## Technical Details

**Store usage** (already available):
```typescript
const { projectLabels, addProjectLabel } = useFinanceStore();
```

**Form state change** in `ProjectOverviewPage.tsx`:
```typescript
// Before
const [formData, setFormData] = useState({ name: '', description: '', internalCost: 0, clientCost: 0, color: '#10B981' });

// After
const [formData, setFormData] = useState({ name: '', description: '', internalCost: 0, clientCost: 0, color: '#10B981', labelIds: [] as string[] });
```

**Label picker UI** -- added below the color picker in the add form, matching the pattern from `ProjectsSection.tsx`:
- Tappable chip buttons for each existing label (filled when selected, outline when not)
- Inline text input for creating a new label on the spot

**Label badges on cards** -- inserted after the transaction count line, showing small colored pills for each assigned label.

## Files Modified
1. `src/components/ProjectOverviewPage.tsx` -- add label picker to form + label badges on cards


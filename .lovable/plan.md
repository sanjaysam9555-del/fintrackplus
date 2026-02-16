

# Project Labels Feature

## Overview
Add a tagging/labeling system for projects (e.g., #birthday, #wedding, #FromXYZ). Labels are user-defined, manageable via Settings, and assignable to projects during creation/editing. The Labels settings page will show expandable cards listing projects under each label.

## Database Changes

**New table: `project_labels`**
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `name` (text, NOT NULL) -- e.g. "Birthday", "Wedding"
- `color` (text, default '#8B5CF6')
- `created_at` (timestamptz, default now())
- RLS: same user-scoped policies as other tables

**Alter `projects` table:**
- Add `label_ids` column (jsonb, default '[]') -- array of label UUIDs

## Type Changes

**`src/lib/types.ts`**
- Add `ProjectLabel` interface: `{ id, name, color, createdAt }`
- Add `labelIds?: string[]` to the `Project` interface

## Store Changes

**`src/lib/store.ts`**
- Add `projectLabels: ProjectLabel[]` to state
- Add CRUD actions: `addProjectLabel`, `updateProjectLabel`, `deleteProjectLabel`
- Include `projectLabels` in cloud sync (load/merge)
- Update `addProject` and `updateProject` sync to handle `label_ids`
- Map `label_ids` jsonb to `labelIds` string array in Project

## UI Changes

### 1. Project Add/Edit Form (`ProjectsSection.tsx`)
- Add a multi-select label picker below the color selector
- Show existing labels as tappable chips (selected = filled, unselected = outline)
- Include a small "+ New Label" inline option that creates a label on the spot

### 2. New Settings Section: `LabelsSection.tsx`
- Header with back button and "Add" button (same pattern as Vendors/Categories)
- Add form: name input + color picker
- Label cards showing:
  - Label name with color dot
  - Project count subtitle
  - Edit/Delete action buttons
  - Expandable section (chevron) showing projects under that label as compact cards with project name, color, and budget info
- Delete confirmation dialog

### 3. Settings Page (`SettingsPage.tsx`)
- Add "Labels" menu item under Data Management (with Tag icon)
- Add `'labels'` to the `SettingsSection` type
- Route to `LabelsSection` component

### 4. Add Transaction Sheet (`AddTransactionSheet.tsx`)
- No changes needed -- labels are project-level, not transaction-level

## Component Structure

```text
Settings Page
  +-- Labels (new menu item)
       +-- LabelsSection.tsx (new file)
            +-- Label cards (expandable)
            +-- Add/Edit form
            +-- Delete confirmation
```

## Implementation Order
1. Database migration (new table + alter projects)
2. Update types
3. Update store with label CRUD + sync
4. Create LabelsSection component
5. Wire into SettingsPage
6. Add label picker to ProjectsSection add/edit form

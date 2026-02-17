
# Add Explicit Save Button for Project Notes

## Problem
The auto-save debounce mechanism for project notes has a race condition: after `updateProject` updates the store optimistically, `project.notes` matches the local `notes` state, so subsequent edits may not trigger saves correctly. The user wants a reliable, explicit save button.

## Changes

### `src/components/ProjectDetailSheet.tsx`

1. **Remove the debounce auto-save logic** (the `useEffect` at lines 158-169 and the `saveNotesRef` pattern at lines 149-156).

2. **Add a `handleSaveNotes` function** that directly calls `updateProject(project.id, { notes }, userId)` and shows a success toast.

3. **Add a Save button** next to the "Project Notes" heading. The button will:
   - Show "Save" with a save icon when there are unsaved changes (i.e., `notes !== (project.notes || "")`)
   - Show a brief "Saved" confirmation state after saving
   - Be disabled when there are no changes
   - Use the same compact styling as other action buttons in the app

4. **Keep the `isSavingNotes` state** to show a loading spinner on the button during save.

5. **Keep the `prevProjectId` ref logic** so notes initialize correctly when opening a project.

### UI Layout
The notes section header will look like:

```
[StickyNote icon] Project Notes          [Save button]
[Textarea field]
```

The Save button will be a small, styled button that appears enabled only when the local notes differ from the saved notes, providing clear feedback that changes need saving.

### Sync
The `updateProject` function in the store already handles syncing notes to the database via the sync queue (line 877: `if (updates.notes !== undefined) dbUpdates.notes = updates.notes`), so no store changes are needed. The save will go through the same sync pipeline as all other data.

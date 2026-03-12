

## Add Label Selection to Project Edit Form (Detail Sheet)

### Problem
The Project Detail Sheet's edit form collects `labelIds` in state but never renders UI to select/remove labels. Users can't edit labels from the detail view.

### Changes

**`src/components/ProjectDetailSheet.tsx`**

Add a label selector section to the edit form (after the color picker, around line 360):
- Show all available `projectLabels` as toggleable chips (same pattern used in `ProjectOverviewPage.tsx` add/edit forms)
- Clicking a chip toggles it in `editForm.labelIds`
- Selected chips show filled style with the label color; unselected show outline style
- This reuses the exact same toggle pattern already in `ProjectOverviewPage.tsx` lines 280-300

### What it looks like
```tsx
{/* Labels - inside edit form, after color picker */}
<div>
  <Label className="text-xs">Labels</Label>
  <div className="flex flex-wrap gap-1.5 mt-1">
    {projectLabels.map((label) => {
      const isSelected = editForm.labelIds.includes(label.id);
      return (
        <button key={label.id}
          onClick={() => setEditForm(f => ({
            ...f,
            labelIds: isSelected
              ? f.labelIds.filter(id => id !== label.id)
              : [...(f.labelIds || []), label.id],
          }))}
          className={`chip styles...`}
          style={{ backgroundColor: isSelected ? label.color : 'transparent' }}
        >
          #{label.name}
        </button>
      );
    })}
  </div>
</div>
```

### Files to change
| File | What |
|------|------|
| `src/components/ProjectDetailSheet.tsx` | Add label chip selector to edit form |


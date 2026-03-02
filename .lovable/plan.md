

# Add Search/Filter to Category, Vendor, and Project Dropdowns

## Problem
When there are many vendors, categories, or projects, users must scroll through a long list in the dropdown popovers to find the right one. There's no way to type and filter.

## Solution
Add a search input at the top of each dropdown popover (Category, Vendor, Project) in both the **Add Transaction** and **Edit Transaction** forms. As the user types, the list filters to show only matching items. This works on both mobile and desktop.

## Changes

### File: `src/components/AddTransactionSheet.tsx`

**1. Add search state for categories and projects** (vendors already has `vendorSearch`):
- Add `categorySearch` and `projectSearch` state variables
- Reset them when their respective popovers close

**2. Category dropdown (lines ~376-431):**
- Add a sticky search `<Input>` at the top of the `PopoverContent`, before the scrollable list
- Filter `filteredCategories` by `categorySearch` before rendering
- Auto-focus the input when popover opens
- Clear search when popover closes

**3. Vendor dropdown (lines ~558-621):**
- Add a search `<Input>` at the top of the `PopoverContent` (the `vendorSearch` state already exists but the input is missing)
- The filtering logic already exists on line 564: `.filter(v => !vendorSearch || v.name.toLowerCase().includes(vendorSearch.toLowerCase()))`
- Just need to render the input field

**4. Project dropdown (lines ~761-838):**
- Add a sticky search `<Input>` at the top of the `PopoverContent`
- Filter `projects` by `projectSearch` before rendering
- Clear search when popover closes

### File: `src/components/EditTransactionSheet.tsx`

Apply the exact same pattern:

**1. Add `categorySearch` and `projectSearch` state variables**

**2. Category dropdown:** Add search input + filter logic

**3. Vendor dropdown:** Add search input (filtering already exists via `vendorSearch`)

**4. Project dropdown:** Add search input + filter logic

## UI Pattern for Each Dropdown

Each popover will follow this structure:

```text
+---------------------------+
| [Search icon] Type to...  |  <-- sticky search input
+---------------------------+
| Item 1                    |
| Item 2                    |  <-- filtered scrollable list
| Item 3                    |
+---------------------------+
| Manage in Settings link   |
+---------------------------+
```

- The search input uses the existing `Input` component with a `Search` icon
- Placeholder text: "Search categories...", "Search vendors...", "Search projects..."
- Input is placed above the scrollable area so it stays visible while scrolling
- Search is case-insensitive partial match on the item name

## Technical Details

- Import `Search` from lucide-react in both files (AddTransactionSheet already imports many icons)
- New state: `categorySearch`, `projectSearch` (string, default "")
- Reset search state in the `onOpenChange` handler: `if (!open) setCategorySearch("")`
- Filter: `filteredCategories.filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase()))`
- Same pattern for projects and vendors
- The search input gets `autoFocus` so users can start typing immediately on desktop; on mobile the keyboard will open automatically

## Files Modified
- `src/components/AddTransactionSheet.tsx`
- `src/components/EditTransactionSheet.tsx`

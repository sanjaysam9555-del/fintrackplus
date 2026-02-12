

# Add Income/Expense Filter Tabs to Categories Section

## Problem
The categories list currently shows all categories (income and expense) combined, making it harder to manage them separately.

## Solution

Add a tab selector at the top of the categories list (below the header) to filter by type: "All", "Expense", "Income".

### Changes in `src/components/settings/CategoriesSection.tsx`

1. **Add filter state**: `const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')`

2. **Add tab bar** between the header and the add form/list area:
   - Three buttons: "All", "Expense", "Income"
   - Styled as a segmented control using `bg-muted` container with `bg-background` for the active tab (matching the existing Tabs component style)
   - Sticky below the header

3. **Filter the categories list**: Wrap the `categories.map()` with a filtered array:
   - `filterType === 'all'` -> show all
   - Otherwise -> show only categories matching `cat.type === filterType`

4. **Auto-set filter when adding**: When the user opens the add form, pre-set the form's type to match the current filter (if not "all"), so adding a category while viewing "Expense" defaults the new category to expense type.

### Layout

```
[Back] Categories          [+ Add]
[ All | Expense | Income ]
-------------------------------
[Category cards filtered by selection]
```


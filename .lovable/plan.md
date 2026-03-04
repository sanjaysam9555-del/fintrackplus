

# Merge "Not Specified" into Existing Filters

## Problem
The "Not Specified" category chip currently appears among the regular category chips (before the divider). The user wants it removed from there and instead have the existing "No Vendor" and "Uncategorized" filters automatically include "Not Specified" entries.

## Changes

### File: `src/components/TransactionList.tsx`

**1. Remove "Not Specified" from the category chips (lines 378-391)**
Filter out any category named "Not Specified" from the `filteredCategories` list rendered before the divider:
```typescript
filteredCategories.filter(c => c.name !== 'Not Specified').slice(0, 6)
```

**2. Update filter logic (lines 47-53)**
The "no-vendor" filter already includes `'Not Specified'` (done in prior change). Update "no-category" to also match transactions whose `categoryId` points to a "Not Specified" category:
```typescript
if (uncategorizedFilter === 'no-category') {
  const notSpecifiedCat = categories.find(c => c.name === 'Not Specified' && c.type === type);
  return !t.categoryId || t.categoryId === '' || (notSpecifiedCat && t.categoryId === notSpecifiedCat.id);
}
```

That's it -- two small edits in one file. The "No Vendor" and "Uncategorized" preset filters will now capture all "Not Specified" entries, and the "Not Specified" chip won't clutter the category row.

## Files Modified

| File | Change |
|------|--------|
| `src/components/TransactionList.tsx` | Hide "Not Specified" from category chips; merge into no-category filter logic |


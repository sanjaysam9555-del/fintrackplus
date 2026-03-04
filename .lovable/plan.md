

# Pre-select "Not Specified" & Pin It to Top in Dropdowns

## Problem
When adding a transaction, the category field starts empty (no pre-selection), and "Not Specified" entries don't appear at the top of category/vendor dropdowns.

## Changes

### File: `src/components/AddTransactionSheet.tsx`

**1. Pre-select "Not Specified" category on form open/type change**

Add an `useEffect` that sets `categoryId` to the "Not Specified" category's ID when the form opens or the transaction type changes (and no category is already selected):

```typescript
useEffect(() => {
  if (!categoryId) {
    const notSpecifiedCat = filteredCategories.find(c => c.name === 'Not Specified');
    if (notSpecifiedCat) setCategoryId(notSpecifiedCat.id);
  }
}, [type, filteredCategories]);
```

Also update the reset logic (line 156) to set `categoryId` to empty string (it already does — the useEffect will re-fill it on next open).

**2. Sort "Not Specified" to top in category dropdown (line ~396)**

Before rendering filtered categories, sort so "Not Specified" comes first:

```typescript
filteredCategories
  .filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase()))
  .sort((a, b) => (a.name === 'Not Specified' ? -1 : b.name === 'Not Specified' ? 1 : 0))
```

**3. Sort "Not Specified" to top in vendor dropdown (line ~588)**

Same sorting for vendors:

```typescript
allVendors
  .filter(v => !vendorSearch || v.name.toLowerCase().includes(vendorSearch.toLowerCase()))
  .sort((a, b) => (a.name === 'Not Specified' ? -1 : b.name === 'Not Specified' ? 1 : 0))
```

## Files Modified

| File | Change |
|------|--------|
| `src/components/AddTransactionSheet.tsx` | Pre-select "Not Specified" category; sort "Not Specified" to top in both category and vendor dropdowns |


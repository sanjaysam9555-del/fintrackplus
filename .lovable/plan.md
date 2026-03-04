

# Fix Missing Icon on "Not Specified" Default Categories

## Problem
When "Not Specified" categories already exist in the cloud database (possibly with empty or null `icon`/`color` fields), the store skips creating them since it only checks `some(c => c.name === 'Not Specified')`. The existing entries may have missing icon/color values, causing invisible or missing icons on the Categories settings page.

## Solution
After the existence check in `src/lib/store.ts`, also **patch** any existing "Not Specified" entries that have missing `icon` or `color` values.

### File: `src/lib/store.ts` (lines ~214-228)

After the current "ensure exists" blocks, add patching logic:

```typescript
// Patch existing "Not Specified" entries with missing icon/color
mergedCategories.forEach((c, i) => {
  if (c.name === 'Not Specified') {
    if (!c.icon) mergedCategories[i] = { ...c, icon: 'other' };
    if (!c.color) mergedCategories[i] = { ...mergedCategories[i], color: '#6B7280' };
  }
});

mergedVendors.forEach((v, i) => {
  if (v.name === 'Not Specified') {
    if (!v.icon) mergedVendors[i] = { ...v, icon: 'Store' };
    if (!v.color) mergedVendors[i] = { ...mergedVendors[i], color: '#6B7280' };
  }
});
```

This ensures that even if the cloud data has "Not Specified" entries with blank icon/color fields, they get patched with sensible defaults before rendering.

## Files Modified

| File | Change |
|------|--------|
| `src/lib/store.ts` | Patch missing icon/color on existing "Not Specified" vendor and category entries |


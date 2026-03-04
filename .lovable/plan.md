

# Add Icon Fix & "Default" Badge to Not Specified Entries

## Problem
1. The "Not Specified" vendor/category entries in Settings are missing their icons (the icon ID may not resolve correctly depending on the render path).
2. There is no visual indicator that these entries are system defaults.

## Changes

### 1. `src/components/settings/CategoriesSection.tsx`
- Add a "Default" badge next to the name for categories where `cat.name === 'Not Specified'`
- Import `Badge` from `@/components/ui/badge`
- After the category name `<p>` tag, add:
  ```tsx
  {cat.name === 'Not Specified' && (
    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">Default</span>
  )}
  ```
- Ensure the icon for "Not Specified" categories renders correctly (icon is `'other'` → maps to `MoreHorizontal`, which should work — verify no issue)

### 2. `src/components/settings/VendorsSection.tsx`
- Add the same "Default" badge next to the vendor name for `vendor.name === 'Not Specified'`
- Ensure the icon renders (icon is `'Store'` — check the `renderIcon` function resolves it)

### 3. `src/lib/store.ts`
- Update the default "Not Specified" category icon from `'other'` to something more meaningful like `'Ban'` or keep `'other'` but ensure the color `#6B7280` (gray) renders properly with the icon component

## Files Modified

| File | Change |
|------|--------|
| `src/components/settings/CategoriesSection.tsx` | Add "Default" tag badge next to "Not Specified" name |
| `src/components/settings/VendorsSection.tsx` | Add "Default" tag badge next to "Not Specified" name |


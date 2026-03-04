

# Fix: Default "Not Specified" Vendor & Category

## Problem
1. The "No Vendor" filter checks for `!t.vendor || t.vendor === 'Unknown' || t.vendor === ''` but misses `t.vendor === 'Not Specified'` -- so transactions saved with the default "Not Specified" vendor don't appear under this filter.
2. There's no explicit "Not Specified" option in the vendor/category dropdowns -- if the user doesn't select one, vendor defaults to `'Not Specified'` string and category defaults to empty string `""`.
3. "Not Specified" appears as a regular vendor in the Vendors settings page and can be deleted.

## Solution
Create system-level "Not Specified" entries for both Vendor and Category that are:
- Always present as the default selection in Add/Edit transaction forms
- Visible in Settings pages but **non-deletable**
- Properly matched by the "No Vendor" / "Uncategorized" filters

## Changes

### 1. Fix the "No Vendor" filter (`src/components/TransactionList.tsx`)

Update line 50 to also match `'Not Specified'`:
```typescript
if (uncategorizedFilter === 'no-vendor') return !t.vendor || t.vendor === 'Unknown' || t.vendor === '' || t.vendor === 'Not Specified';
```

Similarly for "no-category", match transactions where `categoryId` is empty string or the ID of the "Not Specified" category.

### 2. Add default "Not Specified" vendor and category on user creation / data load (`src/lib/store.ts`)

Add a helper that ensures a "Not Specified" vendor and a "Not Specified" category (type: both income and expense, or one for each) exist when data is loaded. If they don't exist, auto-create them. Mark them with a convention (e.g., name exactly `"Not Specified"`) so they can be identified.

### 3. Make "Not Specified" non-deletable in Settings

**`src/components/settings/VendorsSection.tsx`**: Hide the delete button when `vendor.name === 'Not Specified'`.

**`src/components/settings/CategoriesSection.tsx`**: Hide the delete button when `category.name === 'Not Specified'`.

### 4. Default selection in transaction forms

**`src/components/AddTransactionSheet.tsx`**:
- Set vendor initial state to `'Not Specified'` instead of `''`
- Add a "Not Specified" option at the top of the vendor dropdown
- For category, either default to the "Not Specified" category ID or add it as a selectable option at the top of the category dropdown

**`src/components/EditTransactionSheet.tsx`**: Same treatment -- ensure "Not Specified" appears as an option.

### 5. Pagination fix (from prior plan)

Also fix the 1000-row query limit in `src/hooks/useCloudSync.ts` and `src/lib/syncEngine.ts` by implementing paginated fetching for transactions.

## Files Modified

| File | Change |
|------|--------|
| `src/components/TransactionList.tsx` | Update no-vendor and no-category filter to include "Not Specified" |
| `src/lib/store.ts` | Auto-create "Not Specified" vendor and category if missing on data load |
| `src/components/settings/VendorsSection.tsx` | Prevent deletion of "Not Specified" vendor |
| `src/components/settings/CategoriesSection.tsx` | Prevent deletion of "Not Specified" category |
| `src/components/AddTransactionSheet.tsx` | Default vendor to "Not Specified"; add it to dropdown |
| `src/components/EditTransactionSheet.tsx` | Same as above |
| `src/hooks/useCloudSync.ts` | Paginated transaction fetching |
| `src/lib/syncEngine.ts` | Paginated transaction fetching |


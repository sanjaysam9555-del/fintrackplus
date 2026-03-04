

# Fix "Add More" Buttons in Transaction Form

## Problem
The "To add more categories/vendors/projects, go to Settings" buttons in the Add Transaction form use `navigate(appPath('/?tab=settings'))` which doesn't actually deep-link to the correct settings section. The Index page uses internal state (`handleNavigate`) for section routing, not URL query params.

## Solution
Pass an `onNavigate` callback from Index into AddTransactionSheet, and use it instead of `navigate()` to go directly to the correct settings section.

## Changes

### 1. `src/components/AddTransactionSheet.tsx`
- Add `onNavigate?: (section: string) => void` to the props interface
- Replace all 6 instances of `navigate(appPath('/?tab=settings'))` with `onNavigate?.('categories')`, `onNavigate?.('vendors')`, or `onNavigate?.('labels')` (projects are managed under labels) respectively
- Each button already calls `onClose()` before navigating, which is correct

### 2. `src/pages/Index.tsx`
- Pass `onNavigate={handleNavigate}` to the `<AddTransactionSheet>` component (line ~382)

This reuses the existing `handleNavigate` function which already handles setting `settingsSection` and switching `viewMode` to `'settings'`.

## Files Modified

| File | Change |
|------|--------|
| `src/components/AddTransactionSheet.tsx` | Add `onNavigate` prop; replace `navigate()` calls with section-specific `onNavigate()` |
| `src/pages/Index.tsx` | Pass `onNavigate={handleNavigate}` to AddTransactionSheet |


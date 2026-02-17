

# Fix: Partner Form Keyboard Issue and Instant Display

## Problem 1: Keyboard Hides After Each Letter
The `PartnerForm` and `AvatarUploadButton` components are defined as **inline functions inside the `PartnersSection` component**. Every time a letter is typed into the Name input, `setName()` triggers a re-render of `PartnersSection`, which recreates these inline components from scratch. React sees them as entirely new components, unmounts the old input, and mounts a new one -- causing the keyboard to dismiss.

**Fix**: Move `PartnerForm` and `AvatarUploadButton` out of the parent component, or use `useCallback`/stable references. The cleanest approach is to extract them as proper standalone components that receive props.

## Problem 2: New Partner Not Showing Instantly
The `partnerBalances` list is computed with `useMemo` that depends on `getPartnerBalancesForPeriod` and `dateRange`. The function `getPartnerBalancesForPeriod` comes from the Zustand store and its reference never changes, even when `partners` data updates. So the memo never recomputes after adding a partner.

**Fix**: Add `partners` (from the store) as a dependency to the `useMemo` so it recomputes when the partners list changes. Also add `transactions` since balance calculations depend on them too.

## Technical Changes

### File: `src/components/settings/PartnersSection.tsx`

**Change 1 -- Extract `AvatarUploadButton` and `PartnerForm` as stable components**

Move the `AvatarUploadButton` JSX and `PartnerForm` JSX out of the `PartnersSection` render body. Instead, define them as separate React components (either outside the function or memoized) that accept the needed state/handlers as props. This prevents React from unmounting/remounting the input on every keystroke.

**Change 2 -- Fix `partnerBalances` useMemo dependencies**

```typescript
// Before (stale):
const partnerBalances = useMemo(() => {
  return getPartnerBalancesForPeriod(dateRange.start, dateRange.end);
}, [getPartnerBalancesForPeriod, dateRange]);

// After (reactive):
const partnerBalances = useMemo(() => {
  return getPartnerBalancesForPeriod(dateRange.start, dateRange.end);
}, [getPartnerBalancesForPeriod, dateRange, partners, transactions]);
```

Adding `partners` and `transactions` ensures the memo recomputes whenever a partner is added/removed or transactions change.


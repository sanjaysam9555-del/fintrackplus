

## Fix: Default Time Frame Not Applied Across Tabs

### Problem
When you change the "Default Time Frame" in Settings, the individual tabs (Dashboard, Expenses, Income, Partners) don't update. This happens because each component uses `useState(defaultTimeFilter)` — React's `useState` only reads its initial value **once on mount** and ignores subsequent changes.

### Fix

Add a `useEffect` in each affected component that resets `timeFilter` whenever `defaultTimeFilter` changes in the store. This ensures that when you pick a new default in Settings, all tabs sync to that choice (unless the user has manually overridden the filter in that tab).

**Files to modify:**

| File | Change |
|---|---|
| `src/components/Dashboard.tsx` | Add `useEffect` to sync `timeFilter` when `defaultTimeFilter` changes |
| `src/components/TransactionList.tsx` | Same `useEffect` |
| `src/components/settings/PartnersSection.tsx` | Same `useEffect` |

**The effect (same in all 3 files):**
```tsx
useEffect(() => {
  setTimeFilter(defaultTimeFilter);
}, [defaultTimeFilter]);
```

This resets the local time filter whenever the global default changes, keeping all tabs in sync with the user's Settings preference.


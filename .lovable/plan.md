

# Deep Insights: Move to Bottom, Auto-Generate, and Redesign Cards

## Changes

### 1. `src/components/AISummaryPage.tsx`
- **Move Deep Insights** to after Pending Installments (the very bottom of the page)
- **Auto-generate on mount**: Call `generateDeepInsights()` automatically via `useEffect` when `hasData` is true and insights are empty, instead of requiring a manual button press
- **Cache with 2-week TTL**: Store insights + timestamp in `localStorage`. On mount, load cached insights if less than 14 days old; otherwise auto-regenerate. The Refresh button still allows manual regeneration.

### 2. `src/components/ai-summary/DeepInsights.tsx`
- **Remove the "Generate" empty state button** — insights will always auto-load
- **Redesign InsightCard** for better readability:
  - Severity-colored left border strip on each card (blue/amber/red) instead of small icon
  - Category badge + severity label shown together in header
  - Title rendered larger and bolder
  - Body text always visible (no accordion collapse) — the insight content is the whole point
  - Actionable tip styled as a distinct callout box with background tint and lightbulb icon (keep existing but make more prominent with slightly larger text)
  - Add subtle spacing between cards
- **Keep**: Loading skeletons, error state with retry, Refresh button in header

### 3. Layout order (bottom of page)
```
... existing sections ...
Pending Installments
Deep Insights        ← moved here (last section)
```

## Files Modified

| File | Change |
|------|--------|
| `src/components/AISummaryPage.tsx` | Move DeepInsights to bottom, add useEffect auto-generate with localStorage cache (14-day TTL) |
| `src/components/ai-summary/DeepInsights.tsx` | Remove manual generate button, redesign cards: colored left border, always-expanded body, larger title, prominent actionable tip |


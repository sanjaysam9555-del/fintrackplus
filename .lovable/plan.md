
## Root cause
When a settings sub-page (Categories, Vendors, Recurring, All Documents, etc.) is opened on mobile, the parent Settings page has already been scrolled down to the row the user tapped. The sub-page renders into the same scroll container, so it inherits that scroll position — appearing to open ~30–40% down.

This is the classic "no scroll restoration on view change" problem. Since these sub-pages are toggled via internal state (not React Router navigation), the existing stack-overflow `ScrollToTop` (route-based) won't help — we need to scroll on view change.

## Investigation needed
- `src/components/SettingsPage.tsx` — confirm sub-page switching is via local state (e.g. `activeSection`), and identify the scroll container (window vs. inner div).
- The individual section components (`CategoriesSection`, `VendorsSection`, `RecurringSection`, `AllDocumentsSection`, etc.) — confirm none currently handle scroll reset.

## Plan

### Fix: scroll to top when a settings sub-view mounts
Two complementary touches:

1. **In `SettingsPage.tsx`** — add a `useEffect` that fires whenever `activeSection` (or whatever state controls which sub-view is shown) changes to a non-null value:
   ```ts
   useEffect(() => {
     window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
   }, [activeSection]);
   ```
   Also reset on returning to the main settings list (so the back navigation lands at top, not at the previously-tapped row) — or preserve the parent scroll if that's preferred. Recommend resetting to top for both directions for consistency.

2. **Belt-and-braces in each sub-section root** (only if step 1 doesn't catch every entry path) — a one-line `useEffect(() => window.scrollTo(0,0), [])` in the section component's mount.

If the scroll container is an inner div (not `window`), use a ref on that container and call `ref.current?.scrollTo(0,0)` instead.

### Verify back-navigation behaviour
Decide: when user taps the back arrow in a sub-page, should they return to:
- (a) Top of Settings (clean), or
- (b) The exact row they tapped (preserves context)

Recommend **(a)** for simplicity and consistency with current native-app conventions in this codebase. If user wants (b), we'd need to capture & restore scroll position in a ref before opening the sub-view.

## Files touched
- `src/components/SettingsPage.tsx` — add scroll-to-top effect on sub-view change.
- Potentially 1–2 section components if their mount path bypasses the parent effect (will confirm during implementation).

## Out of scope
- Router-level `ScrollToTop` (settings sub-views aren't routes).
- Changing how sub-views are mounted/structured.

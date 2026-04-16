
## Fix Billing back button

**Problem:** Back button on `/billing` calls `navigate(appPath("/"))` which takes user to the Dashboard, not back to the Settings → Subscription page they came from.

**Root cause:** Settings is not a route — it's a `viewMode` state inside `Index.tsx`. There's no URL to navigate back to. The current Back button hardcodes `/`.

**Fix:** Use browser history to go back, with a smart fallback when there is no in-app history (e.g. user landed on `/billing` directly via PaywallGate redirect).

### Changes

**`src/pages/Billing.tsx`** — replace the back handler:
- If `window.history.length > 1` and the previous entry is in-app → `navigate(-1)` (returns to Settings → Subscription).
- Else → navigate to `appPath("/")` with `state: { openSettings: 'subscription' }` so Index opens directly into the Subscription settings section.

**`src/pages/Index.tsx`** — on mount, read `location.state.openSettings`. If present, set `viewMode='settings'` and `settingsSection=<value>`, then clear the state via `navigate(..., { replace: true, state: {} })` so refresh doesn't re-trigger.

**`src/components/settings/SubscriptionSection.tsx`** — when navigating to billing, pass state so we know where to return:
```ts
navigate(appPath("/billing"), { state: { from: 'settings:subscription' } });
```
(Used as a hint by Billing's back handler if needed.)

This makes Back behave intuitively: Billing → Settings (Subscription section) → wherever the user came from before that.

### Files touched
| File | Change |
|---|---|
| `src/pages/Billing.tsx` | Smart back: `navigate(-1)` with fallback to `/` + state |
| `src/pages/Index.tsx` | Honor `location.state.openSettings` to deep-link into Settings sections |
| `src/components/settings/SubscriptionSection.tsx` | Pass `state.from` when opening Billing |

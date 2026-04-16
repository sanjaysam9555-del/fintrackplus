
## Problem
On iPad, clicking Sign Out shows the success toast but the app stays on the current screen instead of navigating to the login page.

## Root cause
`signOut()` in `useAuth.tsx` calls `supabase.auth.signOut()` and relies on the `onAuthStateChange('SIGNED_OUT')` listener to clear `user`/`session` state. The route guard in `App.tsx` only redirects to `/auth` when `user` becomes `null`.

On iPad Safari (and sometimes iPadOS WebViews/PWAs), the `SIGNED_OUT` event is unreliable — it can be delayed, swallowed by ITP/storage partitioning, or fail to propagate when the tab is in a PWA standalone mode. The `await supabase.auth.signOut()` still resolves (so the toast fires), but the React `user` state never becomes `null`, so no re-render → no redirect happens.

A second contributing risk: even if state did update, we depend purely on the `Navigate` element being re-evaluated. An explicit programmatic navigation is safer for the post-logout flow.

## Fix
Make sign-out deterministic instead of event-driven, and force a navigation.

### 1. `src/hooks/useAuth.tsx` — clear state immediately in `signOut`
Inside the `signOut` function:
- Set `intentionalSignOut.current = true`
- Call `await supabase.auth.signOut()` (wrapped in try/catch so iPad failures don't block)
- **Immediately** `setSession(null)` and `setUser(null)` regardless of whether the auth event fires

This guarantees React state matches reality the moment `signOut()` resolves, instead of waiting on a listener that may never fire on iPad.

### 2. `src/components/SettingsPage.tsx` and `src/components/DesktopSidebar.tsx` — force navigation after logout
After `await signOut()`:
- Use `window.location.href` to navigate to the correct auth path based on domain:
  - `isLandingDomain()` → `/application/auth`
  - otherwise → `/auth`
- A hard navigation (`window.location.href`) is intentional here — it also flushes any in-memory caches (Zustand store, React Query) that may still hold the previous user's data, which is good hygiene on logout.

Show the toast *before* the navigation kicks off so the user still sees confirmation.

## Files to update
- `src/hooks/useAuth.tsx` — clear state synchronously inside `signOut`, wrap supabase call in try/catch
- `src/components/SettingsPage.tsx` — force-navigate to auth path after logout
- `src/components/DesktopSidebar.tsx` — same force-navigate fix

## Out of scope
- Login flow, session restore, or splash logic — unchanged
- Other auth events (TOKEN_REFRESHED, SIGNED_IN) — unchanged

## Expected result
On iPad (Safari, PWA, and WebView), clicking Sign Out shows the toast and immediately lands the user on the login page, regardless of whether the Supabase `SIGNED_OUT` event fires.

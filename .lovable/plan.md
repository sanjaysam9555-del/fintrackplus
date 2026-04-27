# Root cause analysis: continuous screen flicker

The flicker users report on onboarding, dashboard, and other screens is **not** a CSS animation glitch. It is the **entire content tree being unmounted and replaced by the full-screen `PageLoader`** repeatedly, every time a background data hook flips its `loading` flag back to `true`. A secondary contributor amplifies the visual noise: the onboarding overlay uses `backdrop-blur` over an animated dashboard underneath.

## What's actually happening

### 1. `useSubscription.fetch()` sets `loading = true` on every refetch (primary cause)

`src/hooks/useSubscription.ts`
- The hook calls `setLoading(true)` at the top of every `fetch()`.
- It subscribes to a Postgres realtime channel on `subscriptions` and calls `fetch()` on **every** insert/update/delete for the org's row.
- It also exposes `refetch` (= the same `fetch`), which `PaywallGate` calls inside its grace-period `setTimeout`.

`src/components/PaywallGate.tsx`
- Renders `<PageLoader className="min-h-screen" />` whenever `loading || onboardingDone === null || (!isActive && grace)` is true.
- Its `useEffect` depends on `subscription?.status` and `refetch`, so any realtime tick re-runs the effect, re-arms the 1.2s timer, calls `refetch()` → `setLoading(true)` → `PageLoader` replaces children → `setLoading(false)` → children remount.

Result: every realtime ping (mandate auth, webhook, even unrelated row touches) flashes the entire app to the spinner and back. On Dashboard this looks like the page "blinking". During Onboarding it remounts the `OnboardingFlow` Suspense subtree mid-animation, producing the worst flicker.

### 2. `UserRoleProvider.fetchRole()` has the same anti-pattern

`src/hooks/UserRoleProvider.tsx` calls `setLoading(true)` on every `fetchRole()`. Anything that calls `refetchRole()` (e.g. `ForcePasswordChange` completion) bubbles `loading=true` up to `useSubscription` (which composes `loading || roleLoading`), which bubbles to `PaywallGate`, which shows the full-screen loader. Same flicker chain.

### 3. `Index.isLoading` toggles from `syncStatus`

`src/pages/Index.tsx` flips `isLoading=false` only when `syncStatus === 'synced' | 'error'`. On a hard reload before the first sync completes, `<DashboardSkeleton />` (full PageLoader) is shown, then swapped for `<Dashboard />`. Combined with cause #1, users see: skeleton → dashboard → spinner (PaywallGate refetch) → dashboard → spinner. That sequence reads as "flickering".

### 4. `OnboardingFlow` uses `backdrop-blur-sm` over an animated Dashboard

`src/components/OnboardingFlow.tsx` line 369: `bg-background/95 backdrop-blur-sm` over the full screen. Dashboard sits behind it (Index renders both) and runs entrance motion + repeating `y: [0, -6, 0]` animation on the empty state. `backdrop-blur` re-samples the layer beneath every frame; combined with the remounts from #1, this produces visible per-frame flicker on lower-end Android.

### 5. Splash screen never shows on subsequent loads but the gate still does

`SplashScreen` exits → `PaywallGate` mounts → `loading=true` initially → `PageLoader` shows → `loading=false` → content. Visually a brief second flash right after the splash. Users perceive it as a flicker between two loaders.

## Fixes (airtight, low-risk for launch)

### Fix A — Stop full-screen remounts on background refetches
Make `useSubscription` and `UserRoleProvider` distinguish **initial load** from **background refresh**:
- Add `initialLoading` (only true until the first fetch settles) and keep `loading` for the in-flight indicator that *callers can ignore*.
- `PaywallGate` and any other gate uses `initialLoading`, not `loading`. Background realtime pings update `subscription` silently without ever returning to the loader.
- Concretely: in `fetch()`, do **not** call `setLoading(true)` on subsequent calls; only set it on the very first call (track with a `hasLoadedOnce` ref). Keep `setLoading(false)` in the finally path.

### Fix B — Make `PaywallGate` resilient
- Depend the grace `useEffect` on stable values only (`loading`, `isActive`, `isBilling`) — drop `refetch` and `subscription?.status` from deps so realtime ticks don't re-arm the timer.
- Use `initialLoading` (from Fix A) for the loader gate condition.
- While `grace` countdown is running and `isActive` is false, render `children` (not the loader). The user is already authenticated; showing the gated page for ≤1.2s is correct and prevents a flash.

### Fix C — Don't unmount Dashboard for sync transitions
- In `Index.tsx`, set `isLoading=false` once we have **any** local data (store hydrated) instead of waiting for `syncStatus`. The first paint shows whatever cached data exists; sync updates flow in silently. Removes the skeleton↔dashboard swap.

### Fix D — Remove `backdrop-blur` from OnboardingFlow overlay
- Replace `bg-background/95 backdrop-blur-sm` with a solid `bg-background` overlay (the onboarding card already obscures the page; the blur adds nothing). Eliminates per-frame resampling.
- While here, stop the infinite `y: [0,-6,0]` animation on the empty-state card in `Dashboard.tsx` — it is not needed and contributes to repaint cost behind the overlay.

### Fix E — Single splash→app transition
- In `App.tsx`, wait for `loading=false` (auth settled) **before** dismissing splash, so the splash hands off directly to content (or auth page) without a second loader frame.

### Fix F — Defensive: guard PageLoader against thrash
- `PageLoader` already uses `animate-fade-in`. If the container mounts/unmounts within ~150ms, the fade-in plays repeatedly. After fixes A–C this should never happen, but add a small mount delay (only render after 120ms) so any residual sub-second loader never reaches the screen.

## Files to edit

- `src/hooks/useSubscription.ts` — add `initialLoading`, suppress `setLoading(true)` on refetch.
- `src/hooks/UserRoleProvider.tsx` — same pattern; export `initialLoading`.
- `src/components/PaywallGate.tsx` — use `initialLoading`; trim effect deps; render children during `grace`.
- `src/pages/Index.tsx` — drop `syncStatus`-driven `isLoading`; consider store-hydration flag instead.
- `src/components/OnboardingFlow.tsx` — remove `backdrop-blur-sm`, use solid background.
- `src/components/Dashboard.tsx` — remove infinite empty-state bounce animation.
- `src/components/SplashScreen.tsx` / `src/App.tsx` — keep splash mounted until `auth.loading=false`.
- `src/components/ui/skeleton-loader.tsx` — add 120ms delayed-mount guard inside `PageLoader`.

## Out of scope (explicitly not changing)

- Visual design of the spinner / round logo (already finalized).
- Realtime channel subscriptions (kept; they update data, just no longer flash the loader).
- Page transition removal (already done in prior turn).

## Verification plan after implementation

1. Hard reload `/` while logged in → expect: splash → dashboard. No spinner in between, no second flash.
2. Open onboarding → expect: solid overlay, card animation only. No background shimmer.
3. Trigger a subscription realtime event (e.g. mandate update) → expect: no full-screen spinner, no remount of Dashboard. Network tab still shows the refetch.
4. Throttle CPU 4× in DevTools → repeat steps 1–3. No visible flicker.

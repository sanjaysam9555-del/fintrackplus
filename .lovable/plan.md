## Problem

The paywall (`PaywallGate`) re-evaluates on every app open / cold launch / iOS resume. Because `useSubscription` always starts with `loading=true` and then performs a fresh DB read, any of the following pushes a comped/active user to `/billing`:

- Cold open on iPhone PWA — RLS read takes longer than the 1.2s grace, `isActive` is still `false`, redirect fires.
- Tab/app resume after a long hide → realtime hasn't reconnected yet, first read returns nothing or stale `created` row, redirect fires.
- `reconcile-subscription` was being invoked too eagerly (Billing page mount + grace refetch), occasionally clearing the Razorpay ID and flipping status to `expired` (the 500 we just patched).

Net effect: comped and paid users get bounced to the subscription page repeatedly.

## Goal

Subscription enforcement must be "trust local cache by default, verify lazily":
1. Once we've ever confirmed access for this org, **never** show the paywall on subsequent app opens until the cache says otherwise.
2. Real server verification runs **at most once every 24 hours**, and only **after a delay** post login / app open (not on the critical path).
3. Realtime updates still take effect immediately when they arrive (so a real cancellation or comp grant flips access without waiting a day) — but they can only **upgrade** trust silently, never bounce a previously-active user mid-session.

## Design

### 1. Local access cache (`src/lib/subscriptionCache.ts` — new)

Per-org localStorage entry:
```
fintrack_sub_access_v1:<orgId> = {
  isActive: boolean,
  status: SubscriptionStatus,
  isComped: boolean,
  trialEnd: string | null,
  compedUntil: string | null,
  cachedAt: number,        // ms
  lastVerifiedAt: number,  // ms — last successful server fetch
}
```

Helpers:
- `readAccessCache(orgId)` / `writeAccessCache(orgId, data)`
- `isCacheFresh(orgId, maxAgeMs = 24h)` — drives the daily check
- `isCacheStillValid(entry)` — re-evaluates `isActive` against `Date.now()` so an expired trial in cache doesn't keep granting access

### 2. `useSubscription` changes

- On mount: synchronously seed `subscription` / `isActive` from `readAccessCache(orgId)`. If a valid cache exists, `loading` starts as `false` (no flash, no race).
- Background `fetch()` still runs once on mount, but result is written to cache. Realtime listener stays as-is.
- Expose `lastVerifiedAt` from the cache.

### 3. Daily verification, delayed (`useSubscriptionVerifier` — new hook, mounted once in `App.tsx`)

```
useEffect:
  if (!user || !orgId) return
  const last = readAccessCache(orgId)?.lastVerifiedAt ?? 0
  const dueIn = Math.max(0, 24*60*60*1000 - (Date.now() - last))
  // Always wait at least 60s after mount so we're never on the critical path
  const delay = Math.max(60_000, dueIn)
  const t = setTimeout(() => { refetch().then(writeCache) }, delay)
  return () => clearTimeout(t)
```

This is the **only** place that triggers a server verification on app open. Login, route changes, tab focus, and PaywallGate mount do **not** trigger checks.

### 4. `PaywallGate` simplified

- Reads access exclusively from the cache-backed `useSubscription` (which is now synchronous on mount when cache exists).
- Remove the 1.2s grace + inline `refetch()` (the verifier hook owns refresh).
- Remove the `reconcile-subscription` self-heal hook from `Billing.tsx` mount (it stays available as a manual "Refresh status" button only).
- Decision tree:
  ```
  if (cacheExists && cache.isActive) → render children, never redirect
  if (!cacheExists) → show PageLoader until first fetch resolves
  if (cacheExists && !cache.isActive && onboardingDone) → redirect to /billing
  ```
- Realtime updates that flip `isActive: true` → write cache, no UI change.
- Realtime updates that flip `isActive: false` → write cache, but **do not** redirect mid-session; redirect only applies on next app open. (Prevents the "user is using the app, webhook lands, they get yanked" experience.)

### 5. Cache invalidation points

Write `lastVerifiedAt = Date.now()` and refresh cache on:
- Successful Razorpay checkout completion (Billing page).
- Manual "Refresh status" / `runReconcile` in Billing or Settings → Subscription.
- The daily verifier hook firing.
- Sign-out → clear all `fintrack_sub_access_v1:*` keys.

### 6. Edge cases

- **First-ever login (no cache):** `useSubscription` shows loader briefly, fetches once, writes cache. Verifier hook is a no-op for 24h after that.
- **Trial expiry mid-session:** cache stores `trialEnd`. `isCacheStillValid` recomputes `isActive` on every read, so when trial naturally expires the cache stops granting access on next mount. The verifier will also catch it within 24h.
- **Comped user:** cache marks `isComped: true`, never bounced.
- **User actually cancels:** webhook → realtime → cache rewritten. Effective on next app open (or immediately in Settings → Subscription where they cancelled from).

## Files to change

- **new** `src/lib/subscriptionCache.ts` — cache helpers
- **new** `src/hooks/useSubscriptionVerifier.ts` — delayed daily check
- `src/hooks/useSubscription.ts` — seed from cache, write cache on fetch/realtime
- `src/components/PaywallGate.tsx` — drop grace timer, trust cache
- `src/App.tsx` — mount `useSubscriptionVerifier` once inside the authed tree
- `src/pages/Billing.tsx` — remove auto-`runReconcile` on mount (keep manual button); write cache after successful checkout
- `src/hooks/useAuth.tsx` — clear cache keys on `signOut`

## Result

- Cold app open / iPhone resume / tab switch → zero subscription network calls, zero paywall flash, zero false redirects for comped or paid users.
- Server-side truth is reconciled at most once every 24h, and only ≥60s after the user is already in the app.
- Real cancellations still propagate via realtime + take effect on next session.

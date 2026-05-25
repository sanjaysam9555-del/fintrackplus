# Why complimentary access keeps bouncing you to /billing

## What's actually in the database

Your org's subscription row is correct:

- `status = expired`
- `is_comped = true`
- `comped_until = null` (i.e. permanent comp)

`recomputeIsActive()` in `src/lib/subscriptionCache.ts` handles this correctly — `isComped && !compedUntil` returns `true`. So the access logic itself is fine. **The bug is in how `PaywallGate` decides when to trust the local cache.**

## The actual bug

`src/hooks/useSubscription.ts` seeds state synchronously from `localStorage` (`readAccessCache(orgId)`). If a cache entry exists, `loading` is initialized to `false`. `PaywallGate` then immediately renders with whatever that cache says.

Sequence that breaks you:

1. Long ago, before you were comped, the cache was written with `isActive: false` (e.g. trial expired).
2. An admin/owner later flipped `is_comped = true` on the row.
3. You open the app on a device. `useUserRole` resolves `orgId`. `useSubscription` immediately seeds from the **old** cache entry → `isActive = false`, `loading = false`.
4. `PaywallGate` sees `!initialActive && onboardingDone` on the first render and fires `<Navigate to="/billing" replace />`.
5. The background verifier in `useSubscriptionVerifier` only runs **60 seconds after mount** — by then you're already stuck on `/billing`. Realtime would fix it, but realtime fires on table changes, not on app open, so a cold open never gets a fresh read in time.
6. On a brand-new device (no cache), the first cold fetch should work — but if the route guard runs before `orgId` resolves and `onboardingDone` is read, edge cases (slow network on iOS PWA resume) still let a stale write win on the next open.

In short: the paywall is willing to **deny access from cache alone**, but only schedules a server check long after the redirect has happened.

## The fix (robust, no schema changes)

Principle: **redirects are destructive; never deny access based on cache without a recent server confirmation.** Granting access from cache is fine (that's the whole point — no flicker for paying users). Denying access from cache is what hurts.

### Changes

1. **`src/lib/subscriptionCache.ts`**
   - Keep `recomputeIsActive` as is.
   - Add a helper `isDenyCacheTrustworthy(entry, ttlMs)` → `true` only when the entry was server-verified within a short window (e.g. 10 minutes) AND `isActive === false`. This is the window in which we'll trust a "no access" verdict from cache alone.

2. **`src/hooks/useSubscription.ts`**
   - Expose `lastVerifiedAt` (already there) and a derived `denyTrusted` flag using the helper above.
   - On seed, if the cache says `isActive: false`, set `loading = true` anyway so the gate waits for a fresh server read instead of redirecting on stale data. (If the cache says `isActive: true`, keep `loading = false` — no regression for paying/comped users with a fresh "active" cache.)

3. **`src/components/PaywallGate.tsx`**
   - Replace the current branch
     ```
     if ((loading && !hasCache) || onboardingDone === null) return <PageLoader />
     ```
     with: show the loader while `loading || onboardingDone === null` **whenever the current decision would be to deny**. Concretely: if `initialActive` would be `false`, wait for `loading` to settle (a fresh server read) before redirecting. If `initialActive` is `true`, render children immediately (current fast path preserved).
   - Add a max wait (e.g. 4s) so a network failure doesn't trap users on a spinner — after timeout, fall back to the cached verdict.

4. **`src/hooks/useSubscriptionVerifier.ts`**
   - Run verification **immediately** (no `POST_MOUNT_DELAY_MS`) when:
     - there is no cache entry, OR
     - the cache says `isActive: false`, OR
     - `lastVerifiedAt` is older than 10 minutes.
   - Keep the 24h+delay path only when the cache is fresh AND says active. This keeps the original "no server calls on the critical path for happy-path paid users" behavior, while making sure anyone who looks denied gets re-checked instantly.

5. **Cache invalidation on comp changes (defense in depth)**
   - In `src/hooks/useSubscription.ts` realtime handler, also write `lastVerifiedAt = now` after the refetch (already does via `writeAccessCache` → `cacheEntryFromRow`). No change needed, but confirm the realtime channel is actually subscribed before the user navigates (it is — happens in a `useEffect`).

### What this fixes

- Comped users with an old "inactive" cache no longer get bounced — gate waits the few hundred ms for the fresh read.
- Paying users with a fresh "active" cache keep the zero-flicker cold open.
- Future comp grants take effect on the very next app open, not 24h later.
- No DB or RLS changes; pure client correctness fix.

### Out of scope

- Changing how comps are granted (admin-console / SQL path).
- Changing trial/Razorpay logic.
- Visual changes to the Billing page or PaywallGate loader.

## Files touched

- `src/lib/subscriptionCache.ts` — add `isDenyCacheTrustworthy` helper, small TTL constant.
- `src/hooks/useSubscription.ts` — don't mark `loading=false` on a deny-seed; expose `denyTrusted`.
- `src/components/PaywallGate.tsx` — gate redirects behind a fresh verification (with timeout fallback).
- `src/hooks/useSubscriptionVerifier.ts` — verify immediately on stale/deny/empty cache; defer only on fresh allow.

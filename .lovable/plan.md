

## Goal
Unblock sanjay.sam9555@gmail.com (org `881ca479…`, sub row id `11b7e9cf…`, Razorpay sub `sub_SfNWAmal8zKSgV`) whose mandate auth succeeded with Razorpay but never made it to our DB because every webhook call was rejected with `Invalid signature` (now fixed, but no replay arrived). Then make the system self-healing so this never strands a user again.

## Root cause recap
- User completed mandate auth → Razorpay marked `sub_SfNWAmal8zKSgV` as `authenticated` and started the trial.
- All webhook events between then and the secret rotation were rejected → DB row still says `status: "created"`.
- Razorpay does not auto-replay old events after secret rotation.
- `useSubscription` reads DB → returns `isActive=false` + `needsMandateAuth=true` → user sees "verification incomplete" forever.

## Fix — two parts

### Part 1 — One-time reconcile for the affected user (backend)

Add a tiny new edge function `reconcile-subscription` (no JWT change, owner-auth required). It:
1. Resolves caller's `org_id` + verifies they're the owner.
2. Loads the org's `subscriptions` row.
3. If `razorpay_subscription_id` exists, calls Razorpay `GET /subscriptions/:id`.
4. Maps live status (reusing the same `mapRzpStatus` table from `create-subscription`) and writes back `status`, `current_period_start`, `current_period_end`, `trial_end` if needed.
5. Returns the updated status.

This is essentially the reconcile block from `create-subscription` extracted into its own callable — safe to call repeatedly, no Razorpay write.

We then invoke it once for Sanjay (he just needs to land on `/billing` and the new auto-reconcile from Part 2 fires it). No DB migration needed.

### Part 2 — Self-heal on Billing page (frontend)

In `src/pages/Billing.tsx`, on mount, if the loaded subscription is in a stuck state — `status === "created"` AND `razorpay_subscription_id` is set AND not `verificationComplete` — call `reconcile-subscription` once, then `refetch()` from `useSubscription`.

Show a brief "Checking with payment provider…" inline loader (no page-blocking spinner) while it runs. If it flips the status to `trialing`/`active`, the existing UI naturally updates, banners disappear, user can use the app.

Add a manual "Refresh subscription status" button on the amber `needsMandateAuth` banner as a backup so the user can always force-recheck.

## Out of scope
- No webhook code changes (signature is now valid for new events).
- No DB migration (only data updates, which the reconcile call performs via Razorpay truth).
- No retroactive replay of old webhook events.

## Files touched
- `supabase/functions/reconcile-subscription/index.ts` — new (~80 lines, mirrors create-subscription's reconcile block).
- `src/pages/Billing.tsx` — add auto-reconcile `useEffect` + manual refresh button on the warning banner.


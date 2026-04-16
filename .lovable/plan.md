
The issue is not really “login” itself. The app is doing exactly what the paywall says: if `useSubscription().isActive` is false, `PaywallGate` sends the user to `/billing`.

What is broken is the subscription state lifecycle.

What I found:
- `src/components/PaywallGate.tsx` redirects every signed-in user to billing whenever `isActive` is false.
- `src/hooks/useSubscription.ts` only treats `active`, valid `trialing`, or valid `is_comped` as access-granting.
- A subscription in `created` is treated as “payment verification incomplete”, so the app blocks access.
- `supabase/functions/create-subscription/index.ts` reuses an existing subscription row when status is `created`, `trialing`, or `active`.
- `supabase/functions/razorpay-webhook/index.ts` is supposed to flip `created` to `trialing`/`active`, but your logs show `payment.failed` events with no `subscription_id`, so some failed/incomplete attempts never repair the DB row.
- Result: orgs get stuck with a stale `subscriptions` row in `created` or another inactive state, and every future login is forced to billing forever.

What needs to be done to solve it properly:

1. Fix the backend subscription reconciliation logic
- Update `create-subscription` so it does not blindly reuse stale `created` rows.
- If the stored Razorpay subscription is no longer actually recoverable/valid, mark the old row as failed/inactive and create a fresh subscription attempt.
- If Razorpay says the subscription is already authenticated/active, sync the DB row immediately before returning.
- If Razorpay says it is cancelled/expired/halted, persist that explicitly instead of leaving the row in `created`.

2. Make webhook handling robust for incomplete/failed attempts
- Update `razorpay-webhook` so payment failures do not leave orphaned “pending/created” records forever.
- Add defensive handling for events that arrive without `subscription_id` by extracting related identifiers where possible and logging enough detail to reconcile later.
- Ensure failed verification updates the matching subscription row to a terminal non-blocking state instead of leaving the org stuck in `created`.

3. Add a durable “effective access” check on the backend
- Expand the existing DB helper model so frontend access does not depend only on raw status text.
- Centralize the rule: access is allowed only for active trial, active paid, or valid complimentary access.
- Use that same backend truth for paywall decisions and admin debugging, so stale client assumptions do not keep happening.

4. Harden the frontend paywall behavior
- Update `useSubscription.ts` to distinguish:
  - truly inactive subscription
  - mandate verification pending
  - stale/broken subscription state
- Update `PaywallGate.tsx` so users are not trapped in a permanent redirect loop if the subscription row is malformed or still reconciling.
- Prefer a short reconciliation/loading state before redirecting, rather than immediately forcing billing on first falsey read.

5. Add recovery path for already-broken orgs
- Create a one-time cleanup strategy for existing subscription rows already stuck in `created`/bad state.
- For rows with invalid or dead Razorpay IDs, reset them so owners can start a clean subscription flow instead of being forced into “payment incomplete”.
- This is essential; otherwise the code fix helps new attempts but not organizations already broken.

6. Verify the full flow end-to-end
- Test these cases:
  - fresh login with valid active subscription
  - fresh login with valid trial
  - failed/cancelled mandate auth
  - retry after failed mandate auth
  - complimentary org
  - stale `created` row recovery
- Confirm that only genuinely unpaid orgs land on billing.

Files likely involved:
- `src/components/PaywallGate.tsx`
- `src/hooks/useSubscription.ts`
- `supabase/functions/create-subscription/index.ts`
- `supabase/functions/razorpay-webhook/index.ts`
- likely one migration to add safer backend reconciliation support if needed

Technical details:
```text
Current bad path:
login
  -> PaywallGate
  -> useSubscription()
  -> row status = created
  -> isActive = false
  -> redirect /billing
  -> billing says "payment incomplete"
  -> create-subscription reuses same stale row
  -> user remains trapped
```

```text
Target path:
login
  -> fetch subscription
  -> reconcile with backend truth
  -> if active/trial/comped: enter app
  -> if stale failed attempt: reset or mark failed
  -> allow clean retry
  -> only unpaid real cases go to billing
```

Implementation note:
This should be treated as a subscription-state bug, not a UI redirect bug. The permanent fix is backend reconciliation + stale-row cleanup, with minor frontend hardening on top.

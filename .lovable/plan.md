
The user provided new Razorpay credentials. I'll update the four secrets and reset stale subscription rows so existing orgs can re-subscribe on the new account.

## Plan

1. **Update 4 Razorpay secrets** in Lovable Cloud:
   - `RAZORPAY_KEY_ID` → `rzp_live_SfN5j8dYf6Eeoa`
   - `RAZORPAY_KEY_SECRET` → `a7wENbsSfrm3QYdS2AdcPEkA`
   - `RAZORPAY_PLAN_ID` → `plan_SfN7FY2vAvsm0i`
   - `RAZORPAY_WEBHOOK_SECRET` → `Fintracksecret`

2. **Reset stale subscription rows** (one-time SQL): For all non-comped orgs, set `razorpay_customer_id = NULL`, `razorpay_subscription_id = NULL`, and `status = 'expired'`. The old IDs are invalid against the new account. Comped orgs untouched.

3. **No code changes** — edge functions read from secrets dynamically.

## What you must do on Razorpay side (in parallel)

- **Register webhook** at: `https://ilgoprsvztbqocbshtoe.supabase.co/functions/v1/razorpay-webhook`
- Subscribe to events: `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`, `subscription.halted`, `subscription.paused`, `subscription.pending`, `payment.failed`
- Use the same webhook secret: `Fintracksecret`
- Confirm plan `plan_SfN7FY2vAvsm0i` exists at ₹499/mo

## Security note
You shared a live Key Secret in plain chat. After this is set, **rotate it in Razorpay Dashboard** (Settings → API Keys → Regenerate) and send me the new value to update the secret again. Treat the current secret as compromised.

## Out of scope
- Refunding/migrating existing Razorpay subscriptions from old account (not possible cross-account).
- Pricing changes.

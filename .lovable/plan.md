
User clarification: They cancelled the ₹5 mandate auth on Razorpay Checkout but the trial still started showing "7 days left." This is actually correct Razorpay behavior — and our DB:

- `create-subscription` creates the Razorpay subscription with `start_at = now + 7 days` and immediately writes `status='created'`, `trial_end = now + 7 days` to our DB.
- `useSubscription.isActive` treats `status='created'` with future `trial_end` as active → trial appears to have started.
- The ₹5 mandate authorization is required to **authenticate** the subscription so the recurring charge can happen on day 7. Without it, Razorpay leaves the subscription in `created`/`pending` and **the first real charge on day 7 will fail** (no mandate = no auto-debit).

So the bug: we're granting trial access on Razorpay subscription **creation**, not on **mandate authentication**. User can spam "Start Trial," cancel the ₹5, and get free access until our `trial_end` passes — then the charge fails silently and they keep using the app until our webhook eventually marks it `halted`.

## Fix

**1. Don't grant trial on `created` status — require mandate auth first**
- In `useSubscription.ts`: remove `status='created'` from `isActive`. Only `trialing` (set by webhook on `subscription.authenticated`) and `active` count.
- The grandfathered orgs already have `status='trialing'` directly in DB (untouched), so existing users keep their trial.

**2. Webhook: handle `subscription.authenticated`**
- When Razorpay fires `subscription.authenticated` (after ₹5 mandate succeeds), update our row to `status='trialing'`. This is the gate that actually starts the trial.
- Add this event to the user's Razorpay webhook config.

**3. Billing page UX**
- Before opening Checkout: prominent info card explaining "Razorpay will charge a refundable ₹1–₹5 to verify your payment method (RBI mandate). Auto-refunded in 5–7 days. Your trial starts only after this verification. First ₹599 charge happens after 7 days."
- Razorpay Checkout `modal.ondismiss` → toast: "Payment method verification cancelled. Trial not started."
- After Checkout success: poll `subscriptions` row for `status='trialing'` (webhook will flip it within seconds), show "Trial activated!" toast.

**4. Settings → Subscription**
- If `status='created'` (mandate not done yet): show amber warning "Payment method verification incomplete. Complete it to start your trial." with a "Complete Verification" button that re-opens Checkout for the same `razorpay_subscription_id`.
- Add the same RBI mandate explanation note near trial countdown.

**5. Bonus: fix forwardRef warning** in `SubscriptionSection.tsx` (from earlier console).

### Files
| File | Change |
|---|---|
| `src/hooks/useSubscription.ts` | Drop `created` from `isActive`; expose `needsMandateAuth` flag |
| `src/pages/Billing.tsx` | Pre-checkout RBI info card; `modal.ondismiss` toast; success polling |
| `src/components/settings/SubscriptionSection.tsx` | Mandate-incomplete warning + resume button; RBI note; forwardRef fix |
| `supabase/functions/razorpay-webhook/index.ts` | Handle `subscription.authenticated` → set `status='trialing'` |
| `supabase/functions/create-subscription/index.ts` | Cosmetic: clearer `notes.description` for ₹5 statement |

### User action required
After deploy, add **`subscription.authenticated`** to your Razorpay webhook events list (Dashboard → Settings → Webhooks → edit → enable that event).

Approve and I'll implement.


User completed Razorpay mandate verification but the Billing page didn't reflect success — only showed a faint "Trial will activate within a minute" toast and stayed put. They want a clear success state + auto-redirect.

## Root cause

In `Billing.tsx` `handleSubscribe` handler (Razorpay `handler` callback):
- Polls for 15s checking if subscription status flipped to `trialing`/`active`.
- If webhook is slow (common — Razorpay webhook fires async, plus the webhook is currently logging "Invalid signature" so it may never flip the status), the poll times out.
- On timeout: just shows a muted `toast.message(...)` and does nothing else. No UI change, no redirect, banners (`needsMandateAuth`, trial warnings) keep showing because `subscription.status` is still `created`/`authenticated`.

Secondary issue: the webhook signature is failing (logs show repeated `[razorpay-webhook] Invalid signature`). That means even waiting longer won't help — the status will never flip until `RAZORPAY_WEBHOOK_SECRET` matches the value configured in Razorpay Dashboard → Webhooks. But that's a separate fix; the UI should still confirm verification succeeded based on Razorpay's client-side success callback alone.

## Plan — `src/pages/Billing.tsx` only

1. **Show immediate success UI** the moment Razorpay's `handler` fires (payment verified client-side), independent of webhook:
   - Add local state `verificationComplete: boolean` and `redirectCountdown: number` (start 10).
   - On `handler` callback: set `verificationComplete = true`, start a 10s countdown, and kick off the existing background poll for status (best-effort, no longer blocks UI).

2. **Render a success card** when `verificationComplete === true` that replaces the pricing/CTA card:
   - Green check icon, "Verification complete!"
   - "Your 7-day free trial is being activated. Redirecting to your dashboard in {N}s…"
   - Manual "Go to Dashboard now" button.
   - Hide the amber `needsMandateAuth` banner and the inactive-subscription banner while `verificationComplete` is true (so stale warnings disappear immediately).

3. **Auto-redirect** via `setInterval` decrementing `redirectCountdown`; when it hits 0, `navigate(appPath("/"))`.

4. **Keep the background webhook poll** but extend it to ~30s and on success show a small toast "Trial activated"; on timeout just stay on the success screen (user already redirected or can click the button).

5. **Cleanup**: clear interval on unmount and on manual navigate.

## Out of scope (mention to user, don't fix here)
- The webhook `Invalid signature` errors — needs `RAZORPAY_WEBHOOK_SECRET` rotated to match the value shown in Razorpay Dashboard → Webhooks → your webhook → Secret. Without that, the DB `subscriptions.status` will stay `created` forever, and even though the UI now confirms success, the trial-active gating elsewhere in the app may misbehave. I'll flag this after the UI fix lands.

No backend / no DB / no edge function changes in this step.

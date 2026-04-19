
User wants option 1: hardening — block live Razorpay checkout on any non-production host so the preview URL can never trigger another unauthorized-origin event with Razorpay.

## Change

Edit `src/pages/Billing.tsx` only. No backend changes, no secret changes.

1. Add a constant `LIVE_HOSTS = ['fintrackplus.com', 'www.fintrackplus.com', 'app.fintrackplus.com']`.
2. Compute `isLiveHost = LIVE_HOSTS.includes(window.location.hostname)` inside the component.
3. In `handleSubscribe`, before loading the Razorpay script, guard:
   - If `!isLiveHost`, show a toast "Subscriptions can only be purchased on app.fintrackplus.com" and return early. Do NOT call `create-subscription` and do NOT open the Razorpay modal.
4. Add a small inline notice card (amber, same style as existing banners) shown only when `!isLiveHost && isOwner`, telling the user to open `https://app.fintrackplus.com/billing` to subscribe, with a clickable link.
5. Disable the Subscribe / Verification CTA button when `!isLiveHost` and change its label to "Available on app.fintrackplus.com".

Result: clicking Subscribe on the `*.lovableproject.com` / `*.lovable.app` preview never reaches Razorpay, so no further unauthorized-origin attempts get logged against the merchant account. Live checkout continues to work normally on `app.fintrackplus.com`.

## Out of scope
- No reply drafted to Razorpay (you can do that separately).
- No changes to edge functions, webhooks, or secrets.

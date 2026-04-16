
The user has comped access (`is_comped: true`, `comped_until: null` = permanent) but the subscription row also has `status: "created"` and `razorpay_subscription_id: "sub_SeFwOqO8cyCtHP"` (a stale Razorpay subscription from before they were comped).

Looking at `useSubscription.ts`:

```ts
const isActive =
  isComped ||
  subscription?.status === "active" ||
  (subscription?.status === "trialing" && trialEndMs > now);

const needsMandateAuth =
  subscription?.status === "created" && !!subscription?.razorpay_subscription_id;
```

So `isActive = true` (good — PaywallGate lets them through). But `needsMandateAuth = true` regardless, because it only checks `status === "created"` and ignores the comped flag. The `Billing.tsx` page (or whatever auto-redirects/shows the verification banner) is using `needsMandateAuth` to force the user onto the billing page and show the "Payment method verification incomplete" CTA.

I need to confirm this by reading `Billing.tsx` and finding what triggers the auto-redirect to `/billing` on every login despite `isActive` being true.

## Root cause (hypothesis, will verify)

`needsMandateAuth` doesn't account for `isComped`. When an org is comped, the leftover Razorpay `created` subscription is irrelevant — they don't need to authenticate any mandate because they're not paying.

Additionally, somewhere (likely in `Billing.tsx` or a top-level effect) `needsMandateAuth` is being used to force navigation to `/billing` and show the incomplete-verification card.

## Fix

### 1. `src/hooks/useSubscription.ts`
Make `needsMandateAuth` respect comped state:
```ts
const needsMandateAuth =
  !isComped &&
  subscription?.status === "created" &&
  !!subscription?.razorpay_subscription_id;
```

### 2. `src/pages/Billing.tsx`
- Hide the "Payment method verification incomplete" card when `isComped` is true.
- Remove/skip any auto-redirect-to-billing effect when `isComped` is true.
- Show the existing Complimentary Access card as the primary state.

### 3. Investigate other call sites
Search for `needsMandateAuth` and any redirect-to-`/billing` logic to make sure no other component pushes comped users to billing. Likely candidates: `App.tsx`, `Index.tsx`, or a banner in a layout component.

## Files to read before editing (verification step in default mode)
- `src/pages/Billing.tsx` — find the verification card + any redirect effect
- Search `needsMandateAuth` across `src/`
- Search for `navigate.*billing` / `Navigate.*billing` to find any forced redirects

## Out of scope
- Razorpay webhook / cleaning up the stale `created` subscription record (data fix; not needed once UI respects `isComped`)
- PaywallGate (already correct — uses `isActive` which includes comped)

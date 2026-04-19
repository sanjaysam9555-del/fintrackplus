
## Goal
Users redirected to `/billing` (post-onboarding, no active subscription) have no escape hatch — no nav, no back button to the app. Add a logout button at the bottom of the Billing page so they can sign out and return to the auth screen.

## Investigation
- `src/pages/Billing.tsx` — confirm current footer/CTA layout
- `src/hooks/useAuth.tsx` — confirm `signOut` method exists
- `src/pages/Auth.tsx` — confirm logout lands users back on the auth screen

## Plan

### Single change: `src/pages/Billing.tsx`
Add a subtle "Sign out" button below the main subscribe/verify CTA section (and below any back button if present), styled as a `ghost` variant with `LogOut` icon from lucide-react.

Behaviour:
- On click → `await signOut()` from `useAuth` → `navigate(appPath('/auth'))`
- Show a brief toast: "Signed out"
- Place inside the same max-width container, centered, with `text-muted-foreground` for low visual weight (it's an escape hatch, not a primary action)

Helper text above the button: *"Not ready to subscribe? You can sign out and come back later."*

## Out of scope
- No changes to onboarding/paywall gating
- No changes to subscription flow
- No new routes

## Files touched
- `src/pages/Billing.tsx`

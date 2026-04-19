
## Understanding
Currently `PaywallGate` (or similar) likely redirects unsubscribed users straight to `/billing` on login, bypassing the onboarding tour. We need onboarding to take precedence so the trial pitch happens at the *end* of the tour, not before it.

## Investigation needed
- `PaywallGate.tsx` — confirm redirect logic
- `useSyncEngine` — how `showOnboarding` is determined (likely from `profiles.onboarding_completed`)
- `Index.tsx` — order of gating (onboarding vs paywall)
- `Auth.tsx` / post-login routing — confirm where trial-incomplete users land

## Plan

### 1. Gating priority (Index.tsx + PaywallGate)
Establish strict order on every authenticated load:
1. **`mustChangePassword`** → ForcePasswordChange screen (existing)
2. **`!onboarding_completed`** → OnboardingFlow (mandatory, ends on trial card → `/billing`)
3. **No active subscription/trial AND `onboarding_completed === true`** → PaywallGate redirects to `/billing`
4. Otherwise → app

This means PaywallGate must check `profile.onboarding_completed` before redirecting. If onboarding isn't done, it does nothing and lets `Index` show the tour.

### 2. Auth.tsx post-login redirect
After successful login (both invited members post-password-change AND self-signups), always navigate to `appPath('/')` — never directly to `/billing`. The Index page itself decides whether to show onboarding or paywall.

### 3. PaywallGate update
- Read `onboarding_completed` from profile (already in context via `useAuth` or fetch alongside subscription).
- Skip redirect when `onboarding_completed === false`.
- Keep existing redirect for users who finished onboarding but have no active trial/subscription (covers: cancelled, expired, never-activated-after-tour).

### 4. Force-password-change flow
After `ForcePasswordChange.onComplete` → `refetchRole()` (existing). On next render, since `onboarding_completed` is still false for fresh invitees, OnboardingFlow shows. No change needed beyond confirming this order in `Index.tsx`.

### 5. Edge case: user closes tab mid-onboarding
`onboarding_completed` stays false → next login resumes from step 1 of tour (acceptable; mandatory means mandatory). Trial card "Activate Trial" is the only way to mark complete + reach billing.

Optional: add a "Go to Billing" fallback if user already has active subscription (re-onboarding scenario) — already in plan from previous step.

## Files touched
- `src/components/PaywallGate.tsx` — gate redirect on `onboarding_completed`
- `src/pages/Auth.tsx` — ensure post-login navigation goes to `appPath('/')`, not `/billing`
- `src/pages/Index.tsx` — verify gating order: password-change → onboarding → paywall (likely already correct; confirm and adjust if needed)

## Out of scope
- No DB changes
- No changes to onboarding step content or trial card
- No changes to subscription logic itself

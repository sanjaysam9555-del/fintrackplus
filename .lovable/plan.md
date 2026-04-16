

## Root cause

The reset-password link is generated server-side via `supabase.auth.admin.generateLink({ type: 'recovery' })` in the `send-email` edge function. That produces an **implicit-flow recovery link** (tokens delivered in the URL hash: `#access_token=…&refresh_token=…&type=recovery`).

But the Supabase client (`src/integrations/supabase/client.ts`) is configured with `flowType: 'pkce'`. PKCE expects a `?code=` query param plus a code verifier stored in localStorage from the original `resetPasswordForEmail` call. Since the link was minted server-side with no PKCE verifier on the user's device, `detectSessionInUrl` silently fails to establish a session. When the user clicks "Update Password", `supabase.auth.updateUser({ password })` runs without a session → **"Auth Session Missing"**.

A second related issue: even when hash tokens are present, the `ResetPasswordPage` doesn't wait for the auth state to finish hydrating before allowing submit.

## Fix

**1. `src/pages/ResetPassword.tsx` — explicitly establish the session from the URL on mount**

On mount, parse the URL for either:
- `#access_token=…&refresh_token=…&type=recovery` (implicit flow, current path) → call `supabase.auth.setSession({ access_token, refresh_token })`
- `?code=…` (PKCE fallback) → call `supabase.auth.exchangeCodeForSession(code)`

Track three states: `verifying` (show spinner), `ready` (show form, session confirmed), `invalid` (show "Link expired or invalid — request a new one" with button back to forgot-password). Only render the form once a real session exists. This eliminates the race and gives a clear error if the link is stale.

After successful `updateUser`, clear the URL hash so a refresh doesn't re-trigger.

**2. `supabase/functions/send-email/index.ts` — keep `generateLink` (works fine), but ensure the redirect target is correct**

Current default `redirectTo` falls back to `https://bright-balance-beam.lovable.app/reset-password`. Update default to `https://fintrackplus.com/reset-password` so production users always land on the live domain. The frontend already passes the correct `redirectTo` per environment, so this is just a safer fallback.

**3. No client config change needed** — `flowType: 'pkce'` stays (used elsewhere). The reset page will handle both flows explicitly.

## Files

| File | Change |
|---|---|
| `src/pages/ResetPassword.tsx` | Parse hash/query on mount, call `setSession`/`exchangeCodeForSession`, gate form on `ready` state, show "invalid link" UI on failure, clear hash after success |
| `supabase/functions/send-email/index.ts` | Update fallback `redirectTo` to `https://fintrackplus.com/reset-password` |

## Result

User clicks reset link in email → page parses tokens from URL hash → calls `setSession` → form renders → password update succeeds. Stale or already-used links show a friendly "Link expired, request a new one" screen instead of a confusing toast.


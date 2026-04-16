

User refinement: pre-invited users (account already created via `manage-team` with temp password) should NOT be allowed to sign up again from the public auth page. Instead, the auth page should detect this and tell them "Account already exists — please log in" with options to log in or reset password.

This is a small but important addition to the previously approved plan. Let me fold it in cleanly.

How to detect "pre-invited but never logged in":
- `manage-team` already creates the auth user + `org_members` row with a temp password, sets `must_change_password=true`.
- On signup attempt, Supabase's `signUp()` with an existing email returns a misleading "fake user" response (security feature) — it doesn't error. So we can't rely on that.
- Solution: add a lightweight pre-check edge function (`check-email-status`) that the auth page calls before submitting signup. It uses service-role to look up the email in `auth.users`:
  - Not found → proceed with signup
  - Found AND user has `org_members` row with `must_change_password=true` → return `{ status: 'invited_pending' }` → UI shows "You've been invited to a team. Please log in with the temporary password sent to your email, or reset your password."
  - Found AND active user → return `{ status: 'exists' }` → UI shows "Account already exists. Log in or reset password."

## Plan additions to the previously approved org lifecycle work

### New edge function — `check-email-status`
- Public (no JWT required), rate-limited by IP
- Input: `{ email }`
- Output: `{ status: 'available' | 'exists' | 'invited_pending' }`
- Uses service-role to query `auth.users` + `org_members`

### Updated `handle_new_user()` trigger logic (replaces previously planned "personal org for everyone")
Three paths:
1. `org_members` row already exists for this user_id → invited flow, attach profile to that org (current behavior, unchanged)
2. Pending `team_invites` row matches NEW.email → attach `invitee_user_id`, still create personal org so they can use the app while deciding
3. Otherwise → create personal org (`is_personal=true`)

### Updated Auth page (`src/pages/Auth.tsx`)
- On signup form submit: call `check-email-status` first
  - `available` → proceed with `supabase.auth.signUp(...)`
  - `invited_pending` → switch UI to a friendly screen: "You've been invited to join [org name]. Check your email for a temporary password and log in below." with two buttons: **Log in** (prefills email) and **Reset password**
  - `exists` → switch UI to: "An account with this email already exists." with **Log in** / **Reset password** buttons
- Same check on the login tab for clearer "no account found → switch to signup" messaging (nice-to-have, low risk)

### Why this is safe
- The check function only returns coarse status (no PII, no profile data leaked beyond "exists or not" which is already inferable from password reset behavior)
- Rate-limited to prevent enumeration abuse

### Files added/changed (delta on top of previously approved plan)
| File | Change |
|---|---|
| `supabase/functions/check-email-status/index.ts` | New — public, rate-limited email status check |
| `supabase/config.toml` | Add `[functions.check-email-status]` with `verify_jwt = false` |
| `src/pages/Auth.tsx` | Pre-flight email check on signup; invited-account messaging screen |
| `handle_new_user()` (in migration) | Updated branching for 3 paths above |

Everything else from the previously approved Part B plan (team_invites table, accept/reject flow, Team UI, admin console updates, etc.) stays exactly the same.


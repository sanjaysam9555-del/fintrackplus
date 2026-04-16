---
name: Data Retention Policy
description: Org and user data must be retained for at least 1 year from last activity, regardless of subscription status. Enforced server-side.
type: constraint
---
**Hard rule:** No user or organization data may be deleted under any circumstances for at least **1 year from the last activity timestamp**, regardless of subscription state (unpaid, cancelled, comped expired, trial ended, etc.).

**"Last activity" definition** — `public.org_last_activity_at(_org_id)` returns the GREATEST of:
- Latest `transactions.created_at` for the org
- Latest `notifications.created_at` for the org
- Latest `auth.users.last_sign_in_at` across all org members
- `organizations.created_at` (fallback)

**Enforcement points:**
- `admin-console` edge function → `delete_org` action calls `org_last_activity_at()` and returns HTTP 403 if `now - last_activity < 1 year`. The super-admin sees the error toast.
- `manage-team` edge function → `remove_member` always deletes `org_members` and the linked partner (immediate access revocation), but only deletes `profiles` + `auth.users` if the user has been inactive (no sign-in/no other org) for ≥1 year. Otherwise the auth account is **banned** for 100 years (reversible by re-adding via `create_member`).

**Out of scope (no auto-deletion exists):** PaywallGate (non-destructive), Razorpay webhook/cancel-subscription (status flags only), backups (additive).

**Why:** Compliance / accidental data loss prevention. Users may return after a lapsed subscription and expect their data intact.

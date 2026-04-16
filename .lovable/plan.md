
The user wants a hard data-retention guarantee: **no user/org data may be deleted for at least 1 year from their last activity**, regardless of subscription status (unpaid, cancelled, comped expired, etc.).

Let me think through where deletions can currently happen:

1. **`admin-console` edge function** — `delete_org` action cascades deletes across all org tables. This is the main risk.
2. **`manage-team`** — likely deletes members (need to check, but member deletion ≠ org deletion; user said "user or organisation").
3. **Subscription-driven deletion** — checking the codebase, there's no automatic cron that deletes orgs on subscription lapse. PaywallGate just blocks access. Good.
4. **Razorpay webhook / cancel-subscription** — should not delete data; just flag status.

The cleanest enforcement point is a **server-side guard** based on "last activity" (latest `transactions.created_at`, `notifications.created_at`, or `auth.users.last_sign_in_at` for the org's members — whichever is most recent). If `now - last_activity < 1 year`, deletion is blocked.

## Plan

### 1. Define "last activity" for an org
Max of:
- Latest `transactions.created_at` for the org
- Latest `notifications.created_at` for the org
- Latest `auth.users.last_sign_in_at` across all org members
- Org `created_at` (fallback so brand-new orgs are also protected)

### 2. Add a SQL helper function
Create `public.org_last_activity_at(_org_id uuid) returns timestamptz` (SECURITY DEFINER) that returns the max of the above. Used by both edge functions and any future cleanup logic.

### 3. Guard `admin-console` `delete_org`
Before cascading delete, call `org_last_activity_at`. If `now() - last_activity < interval '1 year'`, return `403` with a clear message:  
*"Cannot delete: organization was active within the last 1 year (last activity: <date>). Data retention policy requires 1 year of inactivity."*

Add an explicit `force: true` override flag — but **only** allow it if last activity is >1 year ago anyway (so it's just a confirmation flag, never a true bypass). This keeps the policy absolute.

### 4. Guard `manage-team` member removal (if applicable)
Quick check of `manage-team/index.ts` — if it deletes user records, ensure profile/auth deletion only happens when the user has been inactive for >1 year. Otherwise, just remove org membership (`org_members.status = 'removed'`) without touching `auth.users` or `profiles`.

### 5. Document the policy
Add a memory: `mem://policy/data-retention` — "Org and user data is retained for a minimum of 1 year from last activity, regardless of subscription status. Enforced server-side in admin-console.delete_org and manage-team via org_last_activity_at()."

### 6. UI surface (Admin Console)
In `src/pages/AdminConsole.tsx`, when delete is blocked, surface the server error message in the toast so the super-admin sees why.

### Files to touch
- **New migration**: `org_last_activity_at()` function
- **`supabase/functions/admin-console/index.ts`**: guard in `delete_org`
- **`supabase/functions/manage-team/index.ts`**: guard member hard-deletion (verify after read)
- **`src/pages/AdminConsole.tsx`**: surface blocked-deletion error
- **`mem://policy/data-retention`** + index update

### Out of scope (no changes)
- PaywallGate behavior (already non-destructive)
- Backups (additive, never auto-purged here)
- Razorpay webhook (status flags only)

### Edge cases
- Org with zero transactions but recent member sign-in → protected (sign-in counts).
- Org with no members ever signing in but created <1 year ago → protected via `created_at` fallback.
- Comped expiry / cancelled subscription → irrelevant; data stays.

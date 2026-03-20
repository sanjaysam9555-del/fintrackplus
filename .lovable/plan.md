

## Harden Backup Security — Owner-Only Access

### Current Security Gaps

1. **`create-backup` edge function has NO auth check** — it accepts any `org_id` in the request body and creates a backup using the service role key. Anyone who knows the function URL can trigger a backup for any org. The `restore-backup` function already validates the caller is an owner, but `create-backup` does not.

2. **RLS policies are correct** — the `backups` table already restricts SELECT/INSERT/DELETE to owners only. The UI menu is also owner-gated. The gap is purely in the edge function.

### Fix

**`supabase/functions/create-backup/index.ts`** — Add the same auth verification pattern used in `restore-backup`:
- Extract the `Authorization` header
- Verify the JWT to get the caller's `user_id`
- Look up the caller's `org_members` record and confirm `role = 'owner'`
- Use the caller's `org_id` from the DB instead of trusting the request body's `org_id`
- Only fall back to the body's `org_id` when there's no auth header (for the pg_cron scheduled calls, which don't have a user context)

This ensures:
- Manual backup requests from the UI are authenticated and owner-verified
- Scheduled pg_cron calls (which pass `org_id` in the body without auth) still work
- No admin/employee/unauthenticated user can trigger or view backups

### Files to modify
| File | Change |
|---|---|
| `supabase/functions/create-backup/index.ts` | Add JWT auth + owner role verification; derive org_id from DB when auth is present |


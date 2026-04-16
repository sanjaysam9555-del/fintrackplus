
User wants a hidden owner-only admin panel to manage comped subscriptions. Key constraints:
- Hidden via "private link" — not in nav
- Owner-only access
- Manage `is_comped`, `comped_reason`, `comped_until` for any org by ID
- RLS currently blocks UPDATE on subscriptions (no UPDATE policy exists). Need to either add a policy or use an edge function with service role.

Best approach: edge function with service-role key + caller role check. Cleaner than opening up RLS broadly. Also lets us list orgs (which the caller's RLS otherwise hides — they can only see their own org).

Route: `/application/admin/comp` (and `/admin/comp` for app domain). Gated by `useUserRole().isOwner` + extra "super-admin" allowlist (just the founder's user_id) so other org owners can't comp themselves.

Wait — "any org by ID" means cross-org. Even owners shouldn't be able to comp other orgs. Need to restrict to a specific super-admin (the founder). Will use an env-style allowlist by user_id, hardcoded as a constant `SUPER_ADMIN_USER_IDS` in the edge function (and mirrored in the route gate). User can add their own ID.

## Plan

### Route
- `src/pages/AdminComp.tsx` — new hidden page
- Add routes in `App.tsx`: `/admin/comp` and `/application/admin/comp`
- Not linked from anywhere. Gated by: must be logged in + user_id in `SUPER_ADMIN_USER_IDS`. Otherwise → 404.

### UI (`AdminComp.tsx`)
- **Search/list section**: Search orgs by name or paste org_id. Shows: name, owner email, current comp status, plan status, comped_until.
- **Edit form** (per org): toggle `is_comped`, text input for `comped_reason`, date picker for `comped_until` (empty = permanent).
- "Save" calls edge function. Toast on success. Refresh list.
- Minimal styling — matches existing settings sections.

### Edge function: `supabase/functions/admin-comp/index.ts`
- Verify JWT, extract user_id, check against `SUPER_ADMIN_USER_IDS` allowlist. 403 otherwise.
- Actions:
  - `list` → returns all orgs (id, name, owner_id, owner email via auth.admin, subscription status + comp fields)
  - `update` → upserts subscription row for org with `is_comped`, `comped_reason`, `comped_until`. Creates row if missing.
- Uses service role to bypass RLS.

### Super-admin allowlist
Hardcoded constant in both the edge function and the route gate:
```ts
const SUPER_ADMIN_USER_IDS = ['<founder-user-id>'];
```
I'll fetch the founder's user_id from DB during implementation (Sanjay Singh, owner of Saffron Events org `6726455b-3445-41ff-9d56-64481fb66b5f`).

### Files
| File | Change |
|---|---|
| `supabase/functions/admin-comp/index.ts` | New: list/update comp status, super-admin gated |
| `src/pages/AdminComp.tsx` | New: hidden admin UI |
| `src/App.tsx` | Add `/admin/comp` + `/application/admin/comp` routes (lazy) |

### Access
After deploy, visit:
- `https://app.fintrackplus.com/admin/comp`
- or `https://fintrackplus.com/application/admin/comp`

Anyone not in the allowlist sees NotFound.

Approve and I'll implement.

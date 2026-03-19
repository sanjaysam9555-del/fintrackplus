

## Problem Analysis

Swati Sharma logs in and sees no data. Here's what I found:

**Database state**: Org `6726455b` contains 426 transactions, 13 categories, 52 vendors, 16 projects, 2 partners. All data has `user_id = 0f2f00e4` (the original info@ account). Swati's user_id is `32f14251`. Both are members of the same org.

**RLS is correct**: `get_user_org_id('32f14251...')` returns `6726455b`. SELECT queries should return all org data for Swati.

**Root cause**: Multiple code paths still use `.eq('user_id', userId)` which filters out shared org data when the logged-in user isn't the original creator.

### Issues Found

1. **`ensureDefaultTaxonomy` (useSyncEngine.ts:29-33)** — Queries vendors/categories with `.eq('user_id', userId)` (Swati's ID). Since all records have info@'s `user_id`, it finds nothing and tries to INSERT new "Not Specified" entries **without `org_id`** → RLS violation (silent). While caught, this creates unnecessary errors on every login.

2. **`syncEngine.ts` insert (line 213)** — Sets `user_id: userId` on upserts but does NOT set `org_id`. For Swati's new entries, the RLS INSERT check `org_id = get_user_org_id(auth.uid())` will fail because `org_id` is null.

3. **`syncEngine.ts` update/delete (lines 221-233)** — Uses `.eq('user_id', userId)` which means Swati can't update or delete records created by info@ (even though they're in the same org and RLS allows it).

4. **Realtime subscriptions in `useCloudSync.ts` (lines 291-340)** — Filter by `user_id=eq.${user.id}`, so Swati won't get realtime updates for records created by info@. (Note: the app primarily uses `useSyncEngine` which doesn't have this issue, but if `useCloudSync` is still referenced anywhere, it's broken.)

---

## Plan

### Step 1: Fix `ensureDefaultTaxonomy` in useSyncEngine.ts

Remove `.eq('user_id', userId)` from the SELECT queries (RLS already scopes to org). Add `org_id` to INSERT statements by fetching the user's org_id first.

### Step 2: Fix syncEngine.ts write operations

- **Insert/upsert**: Include `org_id` (fetched via `get_user_org_id` RPC or cached from the user's profile/org_members lookup).
- **Update/delete**: Remove `.eq('user_id', userId)` — RLS already restricts access to org members. Keep the partner exception comment.

### Step 3: Add org_id resolution helper

Create a helper in syncEngine.ts that resolves and caches the current user's `org_id` (query `org_members` once per session). Use this for all inserts.

### Step 4: Clean up useCloudSync.ts realtime filters

Remove `filter: \`user_id=eq.\${user.id}\`` from all realtime subscriptions so they receive updates for all org records (RLS already handles access control on the subscription).

---

### Technical Details

**Files to modify:**
- `src/hooks/useSyncEngine.ts` — Fix `ensureDefaultTaxonomy`
- `src/lib/syncEngine.ts` — Fix `executeSyncOperation` (insert/update/delete), add org_id resolution
- `src/hooks/useCloudSync.ts` — Fix realtime subscription filters

**Key change pattern:**
```typescript
// Before (user-scoped):
supabase.from('vendors').select('*').eq('user_id', userId)
supabase.from('vendors').insert({ user_id: userId, name: 'X' })
supabase.from('vendors').update(data).eq('id', id).eq('user_id', userId)

// After (org-scoped):
supabase.from('vendors').select('*')  // RLS handles org scoping
supabase.from('vendors').insert({ user_id: userId, org_id: orgId, name: 'X' })
supabase.from('vendors').update(data).eq('id', id)  // RLS handles auth
```


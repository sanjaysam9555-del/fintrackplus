

# Fix: Partner Delete Fails Silently — Partner Keeps Reappearing

## Root Cause

The sync engine's `processOperation` function (in `syncEngine.ts`, lines 227-233) applies `.eq('user_id', userId)` on **all** delete and update operations. 

For the `partners` table, `user_id` stores the **linked auth account** of the partner — NOT the currently logged-in user who is performing the delete. So when you (the owner) try to delete a partner whose `user_id` points to the team member's account, the query matches zero rows:

```
DELETE FROM partners WHERE id = '<partner-id>' AND user_id = '<your-user-id>'
-- ↑ Matches nothing because user_id = '<team-member-user-id>'
```

The delete silently "succeeds" (no error, zero rows affected). Then the healing refresh (every 30s) re-fetches all partners from the DB and the partner reappears.

## Fix

In `syncEngine.ts`, modify the `update` and `delete` cases in `processOperation` to skip the `user_id` filter for the `partners` table (since RLS already scopes by `org_id`). Only filter by `id`.

### Changes — `src/lib/syncEngine.ts`

**Update case (lines 219-225):** For partners, omit `.eq('user_id', userId)`:
```typescript
case 'update':
  result = await (supabase.from(tableName) as any)
    .update(data)
    .eq('id', entityId);
  // For non-partner entities, also filter by user_id for extra safety
  if (entity !== 'partner') {
    // Re-do with user_id filter
  }
```

Actually, cleaner approach — just conditionally add the `user_id` filter:

```typescript
case 'update': {
  let query = (supabase.from(tableName) as any).update(data).eq('id', entityId);
  if (entity !== 'partner') query = query.eq('user_id', userId);
  result = await query;
  break;
}

case 'delete': {
  let query = (supabase.from(tableName) as any).delete().eq('id', entityId);
  if (entity !== 'partner') query = query.eq('user_id', userId);
  result = await query;
  break;
}
```

RLS policies on the `partners` table already enforce that only owners within the same org can delete/update, so this is safe.

**Files modified**: 1 file — `src/lib/syncEngine.ts`

### Immediate Cleanup

After deploying this fix, the user should delete the ghost partner again. This time the delete will actually reach the DB row and remove it permanently.


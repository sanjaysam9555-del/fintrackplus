

## Make Activity Logs Org-Wide with Team Member Attribution

### Problem
Currently, activity logs (notifications) are stored locally in each user's browser via Zustand/localStorage. This means:
- Each team member only sees their own actions
- Owners cannot see what employees or admins did
- The `actorName` field exists but is meaningless since you only see your own logs

The DB `notifications` table already exists with `org_id` and proper RLS, but it's barely used (only one insert in TeamSection).

### Solution
Persist every notification to the DB `notifications` table so all org members see a unified activity log. Each log entry will clearly show which team member performed the action, with detailed before/after changes.

### Database Changes

**1. Add columns to `notifications` table** (migration):
- `details` (jsonb, default '[]') — stores before/after change arrays
- `entity_type` (text, nullable) — e.g. 'transaction', 'vendor', 'category'
- `entity_id` (text, nullable) — ID of the affected entity
- `actor_name` (text, nullable) — name of the team member who performed the action

### Code Changes

**2. `src/lib/store.ts`** — Modify `addNotification` to also INSERT into the DB `notifications` table:
- After creating the local notification, fire a `supabase.from('notifications').insert(...)` with `user_id`, `org_id`, `type`, `title`, `message`, `details`, `entity_type`, `entity_id`, `actor_name`
- The org_id will be fetched once and cached (similar to sync engine pattern)

**3. `src/components/NotificationsPage.tsx`** — Fetch notifications from DB instead of local store:
- On mount, query `supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200)`
- Map DB rows to the existing `Notification` interface
- Display `actor_name` prominently on each log card (currently it's a subtle "· by Name" at the bottom — make it more visible)
- Keep the existing filter tabs, badge system, and detail rendering
- Subscribe to realtime on the `notifications` table for live updates

**4. `src/lib/store.ts`** — Ensure `actorName` is always set correctly:
- The current code on line 358 already sets `actorName` from `userProfile.name` — this is correct
- Ensure all `addNotification` calls include `entityType` consistently (some are missing it)

### UI Enhancement for Actor Attribution

Each notification card will show the actor name more prominently:
- Move "by {actorName}" from the timestamp line to a dedicated line right below the title, styled as a subtle badge
- Format: **"Vendor Updated"** `EDITED` — *by John Doe*
- For detailed logs like vendor edits: "John changed vendor name from 'ABC' to 'XYZ'"

### Message Text Improvements

Make notification messages more descriptive by including the actor name in the message itself:
- Before: `"Shop ABC"` (message for vendor update)
- After: `"John updated vendor 'Shop ABC'"` 
- Before: `"₹5,000 expense"` (for transaction delete)
- After: `"John deleted expense '₹5,000 - Shop ABC'"`

### Files to modify
| File | Change |
|---|---|
| Migration | Add `details`, `entity_type`, `entity_id`, `actor_name` columns to `notifications` table |
| `src/lib/store.ts` | Persist notifications to DB with all metadata; improve message text to include actor name |
| `src/components/NotificationsPage.tsx` | Fetch from DB instead of local store; show actor name prominently; add realtime subscription |

### Summary
- All activity logs become org-wide (visible to all team members)
- Every log clearly attributes the action to a specific team member by name
- Detailed before/after changes are preserved in the DB
- Realtime updates ensure all team members see logs instantly


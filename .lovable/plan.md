

User wants no deletion. They want me to **fix the display/identification issue** in the Admin Console rather than purge the orphan rows. Cleaner anyway — let the data stay, just classify and present it correctly.

## Plan: Reclassify, don't delete

### What changes
1. **Mark legitimate solo orgs as `is_personal=true`** (data update, no deletion):
   - Set `is_personal=true` on the empty leftover orgs that belong to users who are now active members of another org. These were stale signups, but instead of deleting them we just flag them as "Personal" so they stop showing up as "orphan-duplicate" in the Admin Console.
   - Set `is_personal=true` on real solo users with data (e.g. Shaadi Mai Zaroor Bulana's org).
   - Leave true team orgs (Saffron Events, Guneet's org) as `is_personal=false`.

2. **Update Admin Console health logic** (`supabase/functions/admin-console/index.ts`) to recognise `is_personal=true`:
   - New health bucket: `personal` (replaces the misleading `orphan-duplicate` label for these rows).
   - `orphan-duplicate` only applied if `is_personal=false` AND owner is active in another org AND zero txns. (Should now be 0 rows after step 1.)

3. **Update Admin Console UI** (`src/pages/AdminConsole.tsx`):
   - Add a **"Personal"** filter chip alongside Active / Idle / Empty / Orphan.
   - Personal orgs render with a subtle "Personal" badge (gray) instead of the alarming orphan red.
   - Stats strip adds "X personal" count.

4. **Owner display fix** — verify the org name shown in the app matches the active membership for each user:
   - Swati and Sanya already correctly resolve to Saffron Events / Guneet's org via `get_user_org_id`. No code change needed; the Admin Console was the only place mislabeling them.

### What does NOT change
- No rows deleted from any table.
- No changes to RLS, triggers, or app routing.
- The `delete_org` admin action stays available for future manual use.

### Files
| File | Change |
|---|---|
| Migration | `UPDATE organizations SET is_personal=true WHERE …` for the identified rows (no deletes) |
| `supabase/functions/admin-console/index.ts` | Health logic recognises `is_personal`, new `personal` bucket |
| `src/pages/AdminConsole.tsx` | Personal filter chip, badge, stats count |

Result: Admin Console will show Saffron Events and Guneet's org as the only real team orgs, the leftover signup rows correctly labelled as **Personal**, and zero false-positive "orphans".


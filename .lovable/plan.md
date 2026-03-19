

## Unified Owner-Partner Identity & Cascading Delete

### What This Does

1. **Profile ↔ Partner sync**: When an owner updates their name or avatar (from Profile or Partners page), the change propagates to both `profiles` and `partners` tables automatically. The `user_id` on the `partners` table serves as the universal linking ID.

2. **Auto-partner on signup/invite**: Already handled by `handle_new_user` trigger (fresh signup) and `manage-team` edge function (invited owner). No changes needed here — both already create a partner record with the same name.

3. **Cascading delete with critical warning**: Deleting an owner-linked partner from the Partners page or removing a team member from the Team page triggers a critical warning explaining that it will delete the member across profile, partner, team, and auth. On confirmation (or after approval from the other owner), the `remove_member` edge function handles full cleanup: deletes `org_members`, `partners`, `profiles`, and bans/deletes the auth user.

---

### Files to Modify

**1. `src/lib/store.ts` — `updateUserProfile`**
- After updating `profiles`, also update the linked `partners` row (name + avatar_url) where `user_id = current user`.
- Update local `partners` state to keep UI in sync immediately.

**2. `src/components/settings/PartnersSection.tsx` — Partner avatar/name edit sync**
- When a partner's name or avatar is updated and that partner has a `user_id` matching an org member, also update `profiles.name` / `profiles.avatar_url` for that user.
- On delete: show a critical warning dialog (not just `confirm()`) for owner-linked partners: "This will permanently remove this member from the app — their profile, partner record, team membership, and login will all be deleted."
- The actual deletion calls the `manage-team` edge function `remove_member` action (which handles full cascading cleanup) instead of just `deletePartner`.

**3. `src/components/settings/TeamSection.tsx` — Cascading delete warning**
- Replace the simple `confirm()` with a critical warning dialog matching the partner page: "This will permanently remove this member across the app."
- The `remove_member` edge function already handles cleanup.

**4. `supabase/functions/manage-team/index.ts` — `remove_member` action**
- When removing an owner, also delete their linked `partners` row in the same org.
- Currently the function skips partner deletion ("Never delete partner rows here") — change this to: if the member is an owner, delete the partner record linked via `user_id` + `org_id`, and unassign their transactions (`partner_id = null`).

**5. `src/components/settings/PartnersSection.tsx` — Hide direct delete for owner-linked partners OR route through `manage-team`**
- For owner-linked partners (those with a `user_id` matching an `org_member`), the delete action should invoke `manage-team` `remove_member` instead of the local `deletePartner` store action, ensuring full cascading cleanup.

---

### Technical Details

```text
Profile Edit (name/avatar)
  └─► updates profiles table
  └─► updates partners table (where user_id = current user)
  └─► updates local store (userProfile + partners array)

Partner Edit (name/avatar) for owner-linked partner
  └─► updates partners table
  └─► updates profiles table (where user_id = partner.user_id)
  └─► updates local store

Delete from Team Page or Partners Page (owner-linked)
  └─► Critical warning dialog
  └─► If other owners: approval request
  └─► If approved/no other owners: manage-team remove_member
       └─► deletes org_members row
       └─► deletes partners row (+ unassigns transactions)
       └─► deletes profiles row
       └─► bans/deletes auth user
```

No database migration needed — all tables already have the required columns and relationships.


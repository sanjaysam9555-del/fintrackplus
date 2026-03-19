

# Map Existing Partner to New Owner Account

## Problem
When an Owner creates a new Owner account via Team settings, the edge function creates a brand-new Partner entry. But the partner may already exist in the Partners section with hundreds of transactions. This causes duplicate partners and orphaned transaction history.

## Solution
Add an optional "Link to existing partner" dropdown in the Team add-member form. When creating an Owner, show a list of existing partners. If one is selected, the edge function updates that partner's `user_id` to the new user instead of creating a new partner.

---

## Changes

### 1. TeamSection.tsx — Add partner mapping dropdown
- When role is `owner`, show a dropdown listing existing partners (fetched from the `partners` table).
- Options: "Create new partner" (default) or select an existing partner by name.
- Pass `existingPartnerId` to the edge function when a partner is selected.

### 2. manage-team edge function — Handle partner mapping
- In the `create_member` action, accept an optional `existingPartnerId` field.
- If provided and role is `owner`:
  - Update the existing partner's `user_id` to the new user's ID (instead of inserting a new partner).
- If not provided and role is `owner`:
  - Create a new partner as before.
- The `handle_new_user` trigger also creates a partner for normal signups — since invited users go through the trigger's "invited" path, no duplicate partner is created there (the trigger only creates a profile for invited users, not a partner).

### 3. PartnersSection.tsx — Show mapped email (read-only info)
- No changes needed for the core mapping flow. Optionally, show which user account a partner is linked to (by fetching the profile name for the partner's `user_id`), but this is cosmetic and can be deferred.

---

## Implementation Details

**TeamSection.tsx**:
- Fetch partners list on mount: `supabase.from('partners').select('id, name, user_id')`
- Filter to partners whose `user_id` matches the current owner (i.e., partners not yet mapped to a separate account)
- When role changes to `owner`, show the partner select dropdown
- New state: `existingPartnerId: string | null`
- Pass to edge function: `{ action: 'create_member', email, name, role, existingPartnerId }`

**manage-team/index.ts**:
- Destructure `existingPartnerId` from body in `create_member`
- Replace the partner creation block:
  ```
  if role === 'owner':
    if existingPartnerId:
      UPDATE partners SET user_id = newUser.id WHERE id = existingPartnerId AND org_id = orgId
    else:
      INSERT INTO partners (user_id, name, org_id)
  ```

**Files modified**: 2 files total
- `src/components/settings/TeamSection.tsx`
- `supabase/functions/manage-team/index.ts`




# Add "Link to Partner" Edit for Existing Owner Members

## What
Allow owners to edit their own (or other owners') partner mapping from the Team members list. Each owner member card will show a small edit button to link/re-link to an existing partner.

## Changes

### 1. Edge Function — `supabase/functions/manage-team/index.ts`
Add a new action `link_partner` that:
- Takes `memberId` and `partnerId`
- Verifies the caller is an owner
- Verifies the target member is also an owner role
- Updates the selected partner's `user_id` to the target member's `user_id`
- Optionally unlinks any previously linked partner (sets its `user_id` back or leaves it)

### 2. UI — `src/components/settings/TeamSection.tsx`
- Add state for tracking which member is being edited (`editingMemberId`)
- For each member card where `member.role === 'owner'`, show an edit/link icon button (only visible to the current user if they are an owner)
- When clicked, expand an inline partner selector dropdown (same as the add-member form) showing existing partners
- Also fetch and display the currently linked partner name on each owner's card
- On selection, call the `link_partner` edge function action
- Show success/error toast and refresh the members list

### 3. Data Enrichment
- When fetching members, also fetch partner data to show which partner each owner is currently linked to
- Query `partners` table filtered by each owner member's `user_id` to find their linked partner

## Files Modified
1. `supabase/functions/manage-team/index.ts` — add `link_partner` action
2. `src/components/settings/TeamSection.tsx` — add edit UI for owner partner mapping


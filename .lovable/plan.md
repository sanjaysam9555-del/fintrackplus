

## Enhance Team Page with Member Details

**Current state**: The team member cards only show name, role icon, and role label. Missing: email, avatar/display picture, and the email is not fetched from profiles at all.

**Changes needed** — all in `src/components/settings/TeamSection.tsx`:

### 1. Update data fetching
- Fetch `avatar_url` alongside `name` from profiles table
- Fetch the member's email from `auth.users` via the edge function, OR use the profile data. Since we can't query `auth.users` client-side, we'll fetch email from `org_members` join or add it to the manage-team edge function response. Simplest: store/return email when creating members. For now, we can show email from the user metadata if available, or fetch it via a lightweight edge function call.

**Practical approach**: Update the `manage-team` edge function to support a `list_members` action that returns email from `auth.users` (service role has access). This avoids schema changes.

### 2. Update the TeamMember interface
- Add `email` to the profile type
- Add `avatar_url` to the profile type

### 3. Update the member card UI
- Replace the role icon circle with the member's avatar (fallback to initials)
- Show email below the name
- Show role as a colored badge/chip instead of plain text

### Files to modify
- `src/components/settings/TeamSection.tsx` — UI + fetch logic
- `supabase/functions/manage-team/index.ts` — Add `list_members` action returning emails


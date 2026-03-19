

# Fix: "Email already registered" when re-adding a removed team member

## Root Cause

When a team member is removed via `remove_member`, the edge function only **bans** the auth account (`ban_duration: "876000h"`) but does **not delete** it. So the user record still exists in `auth.users`. When you try to add a new member with the same email, `admin.createUser()` fails with "A user with this email address has already been registered."

Additionally, the `org_members` row is deleted but the `profiles` row for the removed user remains, and the auth user is orphaned.

## Fix — `supabase/functions/manage-team/index.ts`

### 1. Fix `remove_member` action
- Replace `updateUserById` (ban) with `admin.deleteUser()` to fully remove the auth account
- Also delete the `profiles` row for the removed user
- Also delete any `partners` row linked to that user

### 2. Fix `create_member` action — handle edge case of previously banned users
- Before calling `admin.createUser()`, try `admin.listUsers()` filtered by email to check if an existing (banned) user already exists
- If found and banned: unban them, update their password and metadata, then reuse that user ID
- If found and active: return error (genuinely duplicate email)
- This handles any previously banned users from before the fix

### Files Modified
1. `supabase/functions/manage-team/index.ts` — both `create_member` and `remove_member` cases


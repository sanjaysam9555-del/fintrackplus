

## Fix: Force Password Change Stuck for Non-Owner Members

### Root Cause

The `org_members` table has an RLS policy that only allows **owners** to update rows:
```sql
CREATE POLICY "Owners can update org members"
  ON public.org_members FOR UPDATE TO authenticated
  USING (org_id = ... AND get_user_role(auth.uid()) = 'owner');
```

When an admin or employee changes their password, the `ForcePasswordChange` component tries to clear `must_change_password` via a direct update to `org_members`. This silently fails because of RLS — the flag stays `true`, trapping the user on the change password page forever.

### Fix

**1. Add an RLS policy allowing users to update their own `must_change_password` flag**

Create a new migration adding a policy that lets any authenticated user update their own `org_members` row, but **only** the `must_change_password` column. Since RLS policies can't restrict columns directly, we'll use a security-definer function instead.

**2. Create a `clear_must_change_password` security-definer function**

```sql
CREATE OR REPLACE FUNCTION public.clear_must_change_password()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.org_members
  SET must_change_password = false
  WHERE user_id = auth.uid();
END;
$$;
```

This bypasses RLS safely — the user can only clear their own flag.

**3. Update `ForcePasswordChange.tsx`**

Replace the direct `.update()` call with an RPC call:
```typescript
const { error } = await supabase.rpc('clear_must_change_password');
```

**4. After password change, refresh the session**

Call `supabase.auth.refreshSession()` after the password update, then call `onComplete()` to re-fetch the role. This ensures the auth state is stable before navigation.

### Files to Modify

- **New migration** — `clear_must_change_password` security-definer function
- **`src/components/ForcePasswordChange.tsx`** — Use RPC instead of direct update; add session refresh


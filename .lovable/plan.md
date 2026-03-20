

## Three Fixes: Backup Lifetime Note, Session Persistence, Role Caching

### 1. Backup Lifetime Quirky Note

**`src/components/settings/BackupRestoreSection.tsx`** — Replace the subtitle text with a warmer message:

Current: `"Backups are created automatically twice daily. You can also create one manually."`

New: `"Your backups are stored forever — like diamonds, but more useful 💎 Automatic snapshots run twice daily. You can also create one manually."`

No technical changes needed — backups table has no TTL or cleanup policy, so they already persist for lifetime.

---

### 2. Fix Frequent Logouts

**Problem**: The `useAuth` hook doesn't handle the `TOKEN_REFRESHED` or `SIGNED_OUT` events gracefully. More critically, there's no error recovery when a token refresh fails — the user just gets silently logged out.

**`src/hooks/useAuth.tsx`** — Improve session persistence:
- In `onAuthStateChange`, handle `TOKEN_REFRESHED` event explicitly to avoid unnecessary state resets
- Add a `SIGNED_OUT` handler that only clears state if the sign-out was intentional (not a failed refresh)
- Add retry logic: if `getSession()` returns null but localStorage still has a session, attempt `refreshSession()` before giving up

---

### 3. Cache User Role to Avoid Repeated DB Calls

**Problem**: `useUserRole()` is called in 12+ components. Each instance makes its own independent `org_members` query on mount. This means navigating to Settings → Team triggers multiple simultaneous role-fetching queries, slowing page loads.

**Solution**: Lift role data into a React Context (similar to `AuthProvider`) so the query runs once at app startup and all consumers read from the cached context.

**New file: `src/hooks/UserRoleProvider.tsx`**:
- Create `UserRoleContext` with a provider component
- Fetch role once when user is available (after auth)
- Cache `role`, `orgId`, `mustChangePassword`, `memberId` in context state
- Expose all derived booleans (`isOwner`, `canEdit`, etc.)
- Provide `refetch` for the rare cases where role might change mid-session

**`src/hooks/useUserRole.ts`** — Convert to a thin wrapper:
- Change `useUserRole()` to read from `UserRoleContext` instead of making its own DB query
- Keep the same return type so all 12+ consumers need zero changes

**`src/App.tsx`** — Wrap with `UserRoleProvider`:
- Add `<UserRoleProvider>` inside `<AuthProvider>` so it has access to the user
- This ensures the role query runs exactly once per session, not per component mount

### Files to modify

| File | Change |
|---|---|
| `src/components/settings/BackupRestoreSection.tsx` | Add quirky lifetime backup note |
| `src/hooks/useAuth.tsx` | Add token refresh retry and better sign-out handling |
| `src/hooks/UserRoleProvider.tsx` | New — Context provider for cached role data |
| `src/hooks/useUserRole.ts` | Read from context instead of querying DB |
| `src/App.tsx` | Wrap app with `UserRoleProvider` |


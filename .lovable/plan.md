
## Root cause
The Zustand store (`src/lib/store.ts`) persists everything — including `userProfile.avatar`, `partners`, `transactions`, `orgName`, etc. — to `localStorage` under a single shared key `fintrack-storage`. Nothing clears it on sign-out or sign-in. So when **User B** signs in on the same browser previously used by **User A**:

1. The store rehydrates User A's `userProfile.avatar` synchronously on app boot.
2. The Dashboard renders that avatar immediately (line 162 / 219 in `Dashboard.tsx`).
3. Cloud sync runs later and may *not* fully overwrite the avatar if the new user's profile row has `avatar_url = null` (the merge in `setCloudData` falls back to the previous in-memory `userProfile`, line 319: `data.profile || currentState.userProfile || { name: 'User' }`).

Same risk applies to `partners`, `orgName`, `orgLogoUrl`, `notifications`, etc. — any cross-user data leakage from the previous session.

Related pollutants:
- `fintrack_pending_operations` (offline queue) — could replay User A's writes under User B.
- `fintrack_recently_synced` (sync TTL buffer)
- `fintrack_taxonomy_ensured` (sessionStorage — already session-scoped, fine)

## Fix (two complementary layers)

### Layer 1 — Per-user persisted storage key
In `src/lib/store.ts`, change the persist config so the storage key includes the current Supabase user id:
- On boot, read the cached `sb-<project>-auth-token` from localStorage to derive the user id (sync, before hydration).
- Use key `fintrack-storage::<userId>` (or `fintrack-storage::anon` when no user).
- Different users on the same browser get isolated stores — no cross-contamination, ever.

### Layer 2 — Hard wipe on sign-out
In `src/hooks/useAuth.tsx` `signOut()`, after `supabase.auth.signOut()`:
- `useFinanceStore.persist.clearStorage()` (Zustand API) — clears the persisted snapshot.
- Reset in-memory state: `useFinanceStore.setState({ userProfile: { name: 'User' }, transactions: [], categories: [], projects: [], vendors: [], partners: [], projectLabels: [], notifications: [], orgName: '', orgLogoUrl: null, lastSyncedAt: null })`.
- `localStorage.removeItem('fintrack_pending_operations')`
- `localStorage.removeItem('fintrack_recently_synced')`
- `sessionStorage.removeItem('fintrack_taxonomy_ensured')`

### Layer 3 — Defensive merge in `setCloudData`
In `src/lib/store.ts` line 319, when cloud returns a profile row, treat its avatar as authoritative even when null/empty. Replace:
```
userProfile: data.profile || currentState.userProfile || { name: 'User' }
```
with logic that, when `data.profile` exists, uses it verbatim (so a null avatar from cloud actually clears any stale local avatar). Only fall back to `currentState.userProfile` when cloud returned no profile at all.

## Files touched
- `src/lib/store.ts` — per-user storage key in persist config; tighten profile merge in `setCloudData`.
- `src/hooks/useAuth.tsx` — clear store + localStorage keys inside `signOut()`.

## Out of scope
- No DB changes
- No changes to onboarding/billing/paywall flow
- No changes to sync engine logic itself (only the merge guard)

## Verification (after implementation)
1. Sign in as User A with an avatar → see avatar on Dashboard.
2. Sign out → confirm `localStorage` no longer contains `fintrack-storage::<userA-id>` data leaking into a generic key.
3. Sign up as User B (no avatar) on the same browser → Dashboard shows initial "B", never User A's image.
4. Sign back in as User A → avatar returns correctly from cloud.

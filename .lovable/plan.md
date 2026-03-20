

## Fix App Performance: Reduce Redundant Sync Calls

### Root Cause

The sync engine is extremely aggressive — on login alone, it fires:
1. `ensureDefaultTaxonomy` — 3+ DB queries
2. `fullSync` — push queue + fetch ALL 8 tables
3. Realtime subscription fires immediately → another full 8-table fetch
4. Every 30s healing interval → push + full 8-table fetch
5. Every visibility change → full push + pull

Every single sync event re-fetches ALL data (profiles, categories, vendors, projects, transactions, partners, project_labels) even if only one row changed. With realtime + healing + visibility, this results in dozens of full re-fetches per minute.

Additionally, the `useEffect` dependency array on line 301 (`[user, fullSync, syncFromCloud, pushToCloud, setSyncStatus]`) can cause the entire sync infrastructure to tear down and rebuild if any callback reference changes, triggering yet another full sync.

### Changes

**1. `src/hooks/useSyncEngine.ts`** — Stabilize sync setup effect

- Move `syncFromCloud`, `pushToCloud`, `fullSync` into refs so the setup effect only depends on `user`. This prevents the effect from re-running and re-subscribing on every callback identity change.
- Add a debounce/throttle to `syncFromCloud` — ignore calls if one completed less than 5 seconds ago (currently 200ms debounce on realtime is too short and doesn't prevent overlapping fetches).
- Increase healing interval from 30s to 120s (2 minutes). 30s is excessive for a finance tracker.
- Skip `ensureDefaultTaxonomy` on every mount — run it only once per session using `sessionStorage`.

**2. `src/lib/syncEngine.ts`** — Add sync throttling

- Add a `lastFetchTimestamp` variable. If `fetchAllCloudData` was called less than 5 seconds ago, skip (return cached result). This prevents the cascade of realtime + visibility + healing all triggering simultaneous full fetches.
- Increase realtime debounce from 200ms to 1000ms.

**3. Delete `src/hooks/useCloudSync.ts`** — Unused file (dead code), remove it.

### Summary of timing changes

| Mechanism | Before | After |
|---|---|---|
| Realtime debounce | 200ms | 1000ms |
| Fetch throttle | None | 5s minimum gap |
| Healing interval | 30s | 120s |
| `ensureDefaultTaxonomy` | Every mount | Once per session |
| Setup effect deps | Callback refs (unstable) | `user` only via refs |

### Files to modify
- `src/hooks/useSyncEngine.ts` — Stabilize effect deps, session-gate taxonomy, increase healing
- `src/lib/syncEngine.ts` — Add fetch throttle, increase realtime debounce
- Delete `src/hooks/useCloudSync.ts` — Dead code


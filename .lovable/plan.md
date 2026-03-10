
Goal: ship a durable fix so partner transfers never “appear then disappear” again.

What I found (root causes)
1) Circular FK write failure:
- `transactions.linked_transaction_id` has a self-referencing FK.
- Partner transfer currently inserts two rows where each points to the other (`expense -> income`, `income -> expense`).
- Because sync writes rows one-by-one, the first insert fails FK validation, then retries, then gets dropped.

2) Invalid default category IDs:
- `setCloudData` currently creates local “Not Specified” categories with `uuidv4()` when missing in cloud.
- `PartnerTransferSheet` auto-picks first expense/income category, which often becomes these local-only IDs.
- Insert then fails `transactions_category_id_fkey` because those category IDs don’t exist in backend.

Why it “shows then disappears”
- Transfer is added optimistically to local state.
- Sync keeps failing in background; after retry exhaustion, queue removes failed ops.
- Next cloud refresh overwrites local optimistic rows, so transfer vanishes and balances revert.

Implementation plan

1) Remove the schema blocker for circular transfer linking
- Add migration to drop FK constraint on `transactions.linked_transaction_id`:
  - `ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_linked_transaction_id_fkey;`
- Keep column and index for fast linking/querying.
- No RLS policy changes needed.

2) Stop generating fake local category IDs
- In `src/lib/store.ts` (`setCloudData`):
  - Remove `uuidv4()` injection for missing “Not Specified” categories/vendors.
  - Only patch icon/color for entries that already exist.
- This prevents local-only IDs from ever being used in writes.

3) Ensure real default records exist in backend
- In `src/hooks/useSyncEngine.ts`:
  - Add `ensureDefaultTaxonomy(user.id)` before/early in first sync:
    - Ensure `Not Specified` vendor exists.
    - Ensure `Not Specified` category exists for both `income` and `expense`.
  - Then refresh cloud data.
- Add one-time data backfill for existing users so current accounts get these defaults too.

4) Harden transfer category selection + write guards
- In `src/components/PartnerTransferSheet.tsx`:
  - Pick real persisted categories only:
    - Prefer “Not Specified” (if present in store from cloud),
    - else fallback to first available real category by type.
  - If either income/expense category is missing, block submit with clear toast.
- In `src/lib/store.ts` (`addTransaction` and `addPartnerTransfer`):
  - Guard `categoryId` before queueing DB payload.
  - If category is missing/invalid in current store, send `category_id: null` instead of invalid UUID.

5) Improve failure observability for this path
- In `src/lib/syncEngine.ts`:
  - For transfer ops that fail repeatedly, log structured error with operation id + DB message.
  - Surface one user-facing toast when transfer sync is permanently dropped (so failures aren’t silent).

Technical details (concise)
- Files to update:
  - `supabase/migrations/*` (drop linked FK)
  - `src/lib/store.ts` (remove fake defaults + category guards)
  - `src/hooks/useSyncEngine.ts` (default taxonomy bootstrap)
  - `src/components/PartnerTransferSheet.tsx` (safe category resolution + submit blocking)
  - `src/lib/syncEngine.ts` (better permanent-failure signaling)
- Data access/security:
  - Existing RLS policies already enforce per-user access; no policy edits required.

Validation plan
1) Create 5–10 partner transfers in a row.
2) Wait >60s (healing + retries window), confirm none disappear.
3) Hard refresh and relogin, confirm both sides persist and balances remain correct.
4) Delete one transfer side, confirm linked side deletion + Undo restores both.
5) Verify normal Add Transaction with default “Not Specified” also persists.

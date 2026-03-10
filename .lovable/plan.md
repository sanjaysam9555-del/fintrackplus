
Goal: deliver a durable fix so partner transfers never “appear then disappear” and balances don’t temporarily jump back.

What is still happening
- The previous fix serialized concurrent `processSyncQueue()` calls, but it did not prevent queue overwrite from stale snapshots.
- In `src/lib/syncEngine.ts`, `processQueueInternal()` still:
  1) reads queue once,
  2) does async network work,
  3) writes back `updatedQueue`.
- If new operations are added while step (2) is running, step (3) can overwrite and delete them.
- This exactly matches your symptom: transfer entries show locally, then vanish after background sync/heal/realtime refresh.

Implementation plan (solid fix)

1) Make queue processing “merge-safe” (no stale overwrite)
File: `src/lib/syncEngine.ts`

- Replace end-of-pass blind write (`saveSyncQueue(updatedQueue)`) with ID-based reconciliation against the latest queue:
  - Keep a snapshot of operations being processed (by operation `id`).
  - After processing, reload current queue from storage.
  - For each processed op:
    - success / dropped-after-max-retries: remove only that op ID from current queue.
    - failed with retry: update that same op ID only if it still exists (don’t resurrect stale ops).
  - Save reconciled queue.
- Result: newly-added operations during processing are preserved.
- Also harden mutex loop:
  - current code does max 1 extra pass;
  - change to loop while `_pendingReprocess` is set, so bursts are fully drained.

2) Make partner transfer creation atomic at store level
Files: `src/lib/store.ts`, `src/components/PartnerTransferSheet.tsx`

- Add a dedicated store action (e.g. `addPartnerTransfer`) that:
  - creates both transaction IDs up front,
  - inserts both entries into local state in one `set(...)`,
  - queues both sync operations back-to-back,
  - triggers exactly one immediate `processSyncQueue()` call.
- Update `PartnerTransferSheet` to call this single action instead of two separate `addTransaction` calls.
- Result: no intermediate “half transfer” state and less chance of timing gaps.

3) Add defensive sync visibility for failures
File: `src/lib/syncEngine.ts` (small additions)

- Keep retry metadata as now, but add structured logs for failed transfer ops (`vendor: Partner Transfer`, op id, retry count, last error).
- Do not silently mask persistent failures; surface them for debugging and user feedback paths.

Why this is stronger than current
- Current fix prevents two processors from running simultaneously.
- New fix also prevents processor-vs-writer clobbering (the real remaining hole).
- Combined with atomic transfer enqueueing, this removes the disappearing-transfer class reliably.

Technical details (exact code hotspots)
- `src/lib/syncEngine.ts`
  - `processQueueInternal()` queue commit logic (main bug location)
  - `processSyncQueue()` reprocess loop improvement
- `src/lib/store.ts`
  - add `addPartnerTransfer(...)` action near transaction actions
- `src/components/PartnerTransferSheet.tsx`
  - replace dual `addTransaction(...)` flow with single store action call

Validation plan
1) Create 5–10 partner transfers in a row (mixed cash/online).
2) Wait >60s (healing interval + retries window), confirm no entries disappear.
3) Navigate away/back + hard refresh; confirm both sides persist.
4) Verify partner balances remain correct before/after refresh.
5) Delete one transfer side and confirm linked side cascade still works; Undo restores both.
6) Optional stress: create transfer while background sync is active; verify stability.

No backend schema changes required
- This is a client sync correctness fix only (no table/RLS migration needed).

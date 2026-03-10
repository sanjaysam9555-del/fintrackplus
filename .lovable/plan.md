

# Fix: Partner Transfer Transactions Disappearing (Race Condition)

## Root Cause
When two `addTransaction` calls happen back-to-back (expense + income), each independently calls `processSyncQueue()`. The first call loads the queue before the second item is added, syncs the expense, then saves an empty queue — wiping out the income entry. Meanwhile, a Realtime refresh arrives and overwrites local state with cloud data that only has the expense, causing the income to vanish.

## Fix (Two Changes)

### 1. Mutex lock on `processSyncQueue` — `src/lib/syncEngine.ts`
Add module-level `isProcessing` and `pendingProcess` flags. If a second call arrives while processing, it sets `pendingProcess = true` and returns early. After the first pass finishes, it checks `pendingProcess` and runs another pass to pick up newly queued items.

### 2. Skip immediate sync for first transfer transaction — `src/components/PartnerTransferSheet.tsx` + `src/lib/store.ts`
- Add optional `skipImmediateSync` parameter to `addTransaction` in the store
- When `skipImmediateSync` is true, skip the `processSyncQueue()` call (still adds to queue and local state)
- In `PartnerTransferSheet.handleSubmit`, pass `skipImmediateSync: true` for the first (expense) transaction; the second (income) transaction triggers sync normally, which now processes both items together

## Files Modified

| File | Change |
|------|--------|
| `src/lib/syncEngine.ts` | Add mutex lock around `processSyncQueue` |
| `src/lib/store.ts` | Add `skipImmediateSync` param to `addTransaction` |
| `src/components/PartnerTransferSheet.tsx` | Pass `skipImmediateSync` for first transaction |


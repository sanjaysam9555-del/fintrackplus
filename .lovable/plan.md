
Issue restated:
Partner transfer entries are added optimistically, then disappear after sync because backend writes fail; next cloud refresh overwrites local optimistic state, so balances revert.

What I verified:
- Current code already has queue mutex + merge-safe reconciliation + atomic `addPartnerTransfer`.
- The backend still has `transactions_linked_transaction_id_fkey` active and non-deferrable.
- Logs show `23503 ... transactions_linked_transaction_id_fkey` on transfer inserts.
- Category IDs now exist and are valid, so FK on `linked_transaction_id` is the remaining blocker.

Do I know what the issue is? Yes.

Why previous fixes didn’t hold:
- They fixed client queue races, but not the schema constraint that rejects circular transfer inserts (`A -> B` and `B -> A`) when synced one row at a time.

Implementation plan (solid fix):
1) Remove circular schema blocker (primary fix)
- Add a migration to drop `transactions_linked_transaction_id_fkey` only.
- Keep `linked_transaction_id` column and its index for fast pairing logic.
- RLS policies remain unchanged (already correct per-user).

2) Harden sync behavior so transfers never silently vanish again
- In `src/lib/syncEngine.ts`, classify transfer failures:
  - transient/network (`Failed to fetch`, timeouts): keep retrying, do not permanently drop quickly.
  - explicit backend validation errors: surface clear error toast + structured log.
- Keep current merge-safe queue reconciliation.

3) Keep transfer pairing behavior in app logic
- Retain atomic local insert in `addPartnerTransfer` (`src/lib/store.ts`).
- Keep delete-cascade by `linkedTransactionId` (already implemented).
- No UI flow changes needed in `PartnerTransferSheet`.

Technical details:
- Files to change:
  - `supabase/migrations/<new_timestamp>_drop_transactions_linked_fk.sql`
  - `src/lib/syncEngine.ts`
- No changes needed to auth, RLS, or generated client/types files.

Validation plan:
1) Create 5–10 partner transfers quickly (cash + online mix).
2) Wait through healing/retry cycle (>60s), confirm none disappear.
3) Hard refresh and relogin; verify both sides persist and balances remain updated.
4) Delete one side of a transfer; verify linked side deletes too; Undo restores both.
5) Confirm queue does not permanently drop transfer ops on temporary network failure.

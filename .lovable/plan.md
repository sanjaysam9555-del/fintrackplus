## Root cause found

The reported entry **“Debit Card Charges” (₹1,180)** is correctly stored in the backend as assigned to **Axis Company Account** using the company account’s `partner.id`.

The likely remaining bug is local/UI-side identity drift:
- Company bank accounts have both `id` and `user_id` in the database, but accounting rules require them to be keyed by **`partner.id`**.
- Several UI paths still compare or edit partners through `userId` assumptions, and the persisted local store can preserve stale partner objects where `isCompanyAccount` is missing/incorrect.
- That makes the same backend row appear as assigned in one place, unassigned in another, and included in the wrong holder’s balance.

## Plan

1. **Centralize partner identity matching**
   - Strengthen the shared partner identity helper so company accounts always match by `partner.id`.
   - Add safe handling for stale local company-account records that may still carry the owner `userId`.
   - Use the helper consistently for unassigned detection, partner detail rows, balance calculations, transaction display, and edit/add selections.

2. **Fix local merge/persistence drift**
   - In the cloud-data merge path, normalize partner records before saving to the local store.
   - Ensure cloud partner metadata (`isCompanyAccount`, `userId`, balances, name, avatar) wins over stale cached partner metadata unless that exact partner has a pending local edit.
   - This prevents old cached bank-account records from continuing to behave like regular partners after refresh.

3. **Fix settings partner edit paths**
   - Update Financial Holdings / Partners settings edit handlers to use `partner.id` as the edit key.
   - Remove assumptions that `editingPartner` or edit buttons receive a `userId`.
   - This prevents edits to bank accounts from targeting the owner/another partner.

4. **Harden unassigned entries**
   - Keep the Unassigned sheet using the shared helper.
   - Make the parent unassigned badge/count use the exact same helper so the badge and sheet cannot disagree.
   - Exclude any transaction whose `handledBy` matches a valid company account `partner.id` from unassigned stats.

5. **Balance validation**
   - Update partner balance functions to use the same shared matcher instead of inline `partner.isCompanyAccount ? id : userId` comparisons.
   - This makes the bank-account card, partner detail sheet, and unassigned totals agree.

6. **Verify with the reported entry**
   - Confirm “Debit Card Charges” no longer appears in unassigned entries.
   - Confirm it appears under Axis Company Account and reduces that account’s online balance by ₹1,180.
   - Confirm it does not affect Sanjay/other partner balances.
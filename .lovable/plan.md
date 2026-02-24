
Goal
- Make partner balances trustworthy by exposing every transaction that is currently excluded from partner totals, and make reassignment fast.
- Keep the existing balance formula, but make the “why” visible in the UI so you can audit and correct discrepancies.

What is happening today (current logic)
- Partner balances are calculated only from transactions assigned to that partner.
- For each partner and payment mode (cash/online):
  - Opening = Starting Balance + (all income before selected start date) − (all expenses before selected start date)
  - Closing = Opening + (income in selected period) − (expense in selected period)
- Transactions without a partner are excluded from both partners’ balances.
- There are also two integrity gaps in current code:
  1) Undo from list view can restore a transaction without preserving partner assignment.
  2) Deleting a partner says transactions become unassigned, but code currently only deletes the partner record.

Implementation plan

1) Add explicit “Unassigned Entries” audit in Settings → Partners
- File: `src/components/settings/PartnersSection.tsx`
- Add a new summary card above partner cards:
  - Unassigned transaction count
  - Cash net impact and online net impact
  - Clear text: “These are excluded from partner balances until assigned.”
- Add “Review Unassigned” action to open a detailed sheet/list.
- Include both truly unassigned (`partnerId` empty) and orphaned partner links (`partnerId` exists but partner no longer exists) as “needs assignment”.

2) Add review + assign flow for unassigned transactions
- New file: `src/components/settings/UnassignedTransactionsSheet.tsx` (or equivalent inline section if we keep it simpler)
- Show all unassigned/orphaned entries for the selected date range, sorted by date/time.
- For each entry:
  - Show key transaction info
  - Provide quick “Assign to Partner” control
  - On selection, call existing `updateTransaction(id, { partnerId }, userId)` so totals refresh immediately.
- Keep edit option available via existing transaction edit flow for full corrections.

3) Fix data integrity issues causing hidden mismatch risk
- File: `src/components/TransactionItem.tsx`
  - Fix Undo payload to preserve full transaction fields, including `partnerId` (and other metadata), so restored entries do not silently become unassigned.
- File: `src/lib/store.ts`
  - In `deletePartner`, actually unassign affected transactions (set `partnerId` to null/undefined locally + queue sync updates) so behavior matches confirmation text and no “ghost” assignments remain.

4) Add “No Partner” quick filter in transaction lists for faster cleanup
- File: `src/components/TransactionList.tsx`
- Extend uncategorized chips with a “No Partner” chip (`!t.partnerId`), so you can quickly audit from Income/Expense screens too.
- This provides a second, high-speed path to clean partner assignment issues.

5) Improve calculation transparency in Partners UI
- File: `src/components/settings/PartnersSection.tsx`
- Keep current formula, but explicitly show:
  - “Balances are based on assigned entries only”
  - If unassigned exists, show warning badge/count.
- This prevents silent trust issues and explains why total may differ from real-world cash until assignment is complete.

Technical notes
- No backend schema changes required.
- No migration needed.
- Reuses existing store actions and sync queue behavior.
- Works offline-first (assignments queue and sync when online).

Validation checklist (end-to-end)
1) Create a transaction without partner → appears under Unassigned.
2) Assign it from Partners screen → it disappears from Unassigned and updates the selected partner balance immediately.
3) Delete + Undo a partner-tagged transaction from list → partner assignment remains intact after restore.
4) Delete a partner → related transactions move to Unassigned bucket and remain editable.
5) Cross-check for both partners: opening + income − expense matches closing after cleanup.

Expected outcome
- You get one dedicated place to reconcile missing partner tags.
- Partner balances become auditable and explainable line-by-line via assignment cleanup.
- The final numbers for both partners will reflect reality once unassigned/orphaned entries are corrected.

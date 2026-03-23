

## Add Recurring Transactions Management Page in Settings

### What
Add a new "Recurring" section in Settings where users can view all recurring transactions (both income and expenses), see their frequency and next occurrence, and edit or remove the recurring flag from any entry.

### UI Design
- New menu item in Settings under "Data Management": icon `RefreshCw`, label "Recurring", sublabel showing count (e.g., "3 active")
- Section page with two tabs: "Expenses" and "Income"
- Each item shows: title/vendor, amount, frequency badge (Daily/Weekly/Monthly/Yearly), next occurrence date
- Tapping an item opens the existing `EditTransactionSheet` to edit the transaction
- A toggle or button to remove the recurring status from a transaction directly

### Files to create/modify

| File | Change |
|---|---|
| `src/components/settings/RecurringSection.tsx` | **New file** — Recurring transactions management page with tabs for income/expenses, list of recurring items, edit and remove-recurring actions |
| `src/components/SettingsPage.tsx` | Add "Recurring" menu item to dataItems, add section routing for `activeSection === 'recurring'`, import the new component |
| `src/pages/Index.tsx` | Add `'recurring'` to the `SettingsSection` type union |

### Behavior
- Uses `useFinanceStore` to get all transactions, filters for `isRecurring === true`
- Uses `useRecurringTransactions` hook for next occurrence calculation
- Edit: opens `EditTransactionSheet` with the selected transaction
- Remove recurring: updates the transaction in DB setting `is_recurring = false` and `recurring_frequency = null`, then refreshes local store
- Accessible to owners and admins only (same as other data management items)


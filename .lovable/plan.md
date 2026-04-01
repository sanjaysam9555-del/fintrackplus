

## Add Company Bank Account to Financial Holdings

### Concept
Model the company bank account as a special partner record with an `is_company_account` boolean flag. This reuses the entire existing balance calculation, Financial Holdings display, and "Handled By" picker infrastructure with minimal changes.

### Database
**Migration**: Add `is_company_account` column to `partners` table:
```sql
ALTER TABLE public.partners ADD COLUMN is_company_account boolean NOT NULL DEFAULT false;
```
No new RLS policies needed — existing partner policies cover it.

### Changes

**`src/lib/types.ts`**
- Add `isCompanyAccount?: boolean` to the `Partner` interface

**`src/lib/store.ts`**
- Map `is_company_account` to/from `isCompanyAccount` in all partner CRUD and sync operations
- Sort partners so the company account appears first (or last) in lists

**`src/components/settings/PartnersSection.tsx`**
- Add a button/card to create a Company Bank Account (only one allowed per org)
- When creating: set `is_company_account: true`, `initial_cash_balance: 0` (locked), configure `initial_online_balance`
- Show it with a distinct icon (Building2/Landmark) and label "Company Account" in the partners list
- Allow editing the name and initial online balance; hide cash balance fields for company accounts

**`src/components/AddTransactionSheet.tsx`** and **`src/components/EditTransactionSheet.tsx`**
- In the "Handled By" picker, show the company account as a visually distinct option (with a bank icon) separated from individual partners
- When company account is selected and payment method is "cash", either auto-switch to "online" or show a hint that company account is online-only

**`src/components/PartnerBalanceCard.tsx`** (Financial Holdings on Dashboard)
- Show the company account card with a bank icon instead of avatar
- Display only the Online balance column (hide/collapse the Cash column since it's always zero)

**`src/components/PartnerTransferSheet.tsx`**
- Include the company account in transfer options so funds can move between partners and the company account

### UI behavior
- Only one company account per org (button disabled/hidden if one exists)
- Company account always has `paymentMethod = 'online'` — cash is irrelevant
- In Financial Holdings, company account renders with a Landmark icon and "Company Bank Account" label
- Balance calculation uses the same `getPartnerBalancesForPeriod` — no formula changes needed

### Files to modify
| File | Change |
|---|---|
| Migration SQL | Add `is_company_account` column |
| `src/lib/types.ts` | Add `isCompanyAccount` to Partner |
| `src/lib/store.ts` | Map new field in partner CRUD/sync |
| `src/components/settings/PartnersSection.tsx` | Add company account creation/editing UI |
| `src/components/AddTransactionSheet.tsx` | Show company account in Handled By picker |
| `src/components/EditTransactionSheet.tsx` | Same picker update |
| `src/components/PartnerBalanceCard.tsx` | Render company account with bank icon, online-only display |
| `src/components/PartnerTransferSheet.tsx` | Include company account in transfers |




## Properly Integrate Company Bank Account into Financial Holdings

### The Real Problem

The company bank account partner record shares the same `user_id` as the owner. The balance calculation (`t.handledBy === partner.userId`) matches transactions to BOTH the owner's personal record and the company account — causing duplicated balances. The previous "fix" just hid the company account entirely, which doesn't solve the tracking need.

### Core Design Decision

The company bank account needs its **own identity** for transaction attribution. When a transaction is done on the company bank account, `handledBy` must store the **company account's `partner.id`** (not the owner's `user_id`). This cleanly separates company account transactions from personal partner transactions.

### How It Works

```text
┌──────────────────────────────────────────────────┐
│  Transaction Form — "Handled By" dropdown        │
│                                                  │
│  ● Ajay (Owner)         ← userId: abc-123       │
│  ● Priya (Admin)        ← userId: def-456       │
│  ● 🏦 Company Account   ← partnerId: xyz-789    │
│                                                  │
│  handledBy stores:                               │
│    partners → partner.userId                     │
│    company acct → partner.id (the partner row)   │
└──────────────────────────────────────────────────┘

Balance Matching:
  Regular partner:  t.handledBy === partner.userId
  Company account:  t.handledBy === partner.id
```

**Transfers**: Partner → Company Account (deposit into bank) or Company Account → Partner (withdrawal from bank) work exactly like existing team transfers. The company account appears in the transfer sheet as a selectable entity with a bank icon.

**Single balance**: The company account shows ONE combined balance (no cash/online split) since it's a bank account. Uses `initialOnlineBalance` as the starting balance.

### Changes

**1. `src/lib/types.ts`**
- Add `isCompanyAccount?: boolean` to `Partner` interface

**2. `src/lib/syncEngine.ts`**
- Remove the `.filter()` that excludes `is_company_account`
- Map `is_company_account` → `isCompanyAccount` in partner mapping

**3. `src/lib/store.ts`**
- `getPartnerBalancesForPeriod`: For company accounts, match `t.handledBy === partner.id` (not `partner.userId`). Combine cash+online into a single balance using `initialOnlineBalance` as the starting point
- `getPartnerBalances`: Same matching logic change
- `getPartnerName` helpers: Also check `partner.id` match for company accounts

**4. `src/components/AddTransactionSheet.tsx`**
- In "Handled By" dropdown: show company account with a bank icon, visually distinct
- When selected, set `handledBy = partner.id` (not `partner.userId`) for the company account
- Force `paymentMethod = 'online'` when company account is selected (it's a bank account)

**5. `src/components/EditTransactionSheet.tsx`**
- Same changes as AddTransactionSheet for the Handled By dropdown
- Correctly resolve selected partner for company accounts

**6. `src/components/PartnerBalanceCard.tsx`**
- Render company account as a separate card at the top with a `Landmark`/bank icon
- Show single "Bank Balance" instead of cash/online split
- Show transaction count
- Regular partners render below as before

**7. `src/components/PartnerTransferSheet.tsx`**
- Include company account in From/To partner lists with bank icon styling
- When company account is selected, lock payment method to `online`

**8. `src/components/settings/PartnersSection.tsx`**
- Show company account with distinct bank styling
- Allow editing starting balance (maps to `initialOnlineBalance`)
- Prevent deletion of company account record

### Files to modify
| File | Change |
|---|---|
| `src/lib/types.ts` | Add `isCompanyAccount` to Partner |
| `src/lib/syncEngine.ts` | Remove filter, map `is_company_account` |
| `src/lib/store.ts` | Fix balance matching for company accounts |
| `src/components/AddTransactionSheet.tsx` | Company account in Handled By dropdown |
| `src/components/EditTransactionSheet.tsx` | Same dropdown changes |
| `src/components/PartnerBalanceCard.tsx` | Distinct bank card at top |
| `src/components/PartnerTransferSheet.tsx` | Include company account in transfers |
| `src/components/settings/PartnersSection.tsx` | Bank account management UI |


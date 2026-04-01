

## Add Self-Transfer (Cash ↔ Online) Within a Partner

### What
Add a "Deposit / Withdraw" option per partner in Financial Holdings so they can move money between their own Cash and Online balances without affecting org totals.

### How It Works
A self-transfer creates a **linked pair of transactions** on the same partner:
- **Deposit** (Cash → Online): expense with `payment_method='cash'` + income with `payment_method='online'`  
- **Withdraw** (Online → Cash): expense with `payment_method='online'` + income with `payment_method='cash'`

Both tagged with vendor `"Self Transfer"` and linked via `linkedTransactionId`. Excluded from org totals (like Partner Transfers).

### Changes

**1. `src/lib/store.ts`**
- Add `addSelfTransfer` action that creates the linked pair with the same `handledBy` but opposite payment methods
- Vendor = `"Self Transfer"` to distinguish from Partner Transfers
- Update total calculations to exclude `"Self Transfer"` vendor (alongside existing `"Partner Transfer"` exclusion)

**2. `src/components/PartnerBalanceCard.tsx`**
- Add a small `ArrowUpDown` / swap icon button per partner row (next to the partner name or between Cash/Online boxes)
- Clicking opens a lightweight self-transfer dialog/sheet

**3. New: `src/components/SelfTransferSheet.tsx`**
- Bottom sheet with: partner name (read-only), direction toggle (Deposit/Withdraw), amount input, date picker, optional notes
- Calls `addSelfTransfer` on submit
- Simpler than PartnerTransferSheet since from/to is the same partner

**4. `src/lib/store.ts` — balance exclusion**
- In `getPartnerBalancesForPeriod` and anywhere org totals are computed, also exclude `vendor === 'Self Transfer'` from org-wide income/expense (it's an internal rebalance, not real income/expense)

### Files
| File | Change |
|---|---|
| `src/lib/store.ts` | Add `addSelfTransfer` action + exclude from org totals |
| `src/components/SelfTransferSheet.tsx` | New lightweight sheet for cash↔online self-transfer |
| `src/components/PartnerBalanceCard.tsx` | Add per-partner swap button that opens SelfTransferSheet |


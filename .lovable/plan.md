

## Add Cash ↔ Online Self-Transfer (Withdraw / Deposit)

### Concept
Allow a partner to move money between their own cash and online balances. For example:
- **Withdrawal**: Online → Cash (withdrew from bank)
- **Deposit**: Cash → Online (deposited to bank)

Mechanically this creates two linked transactions on the **same partner** — an expense in one payment method and an income in the other.

### Implementation

**1. New component: `src/components/SelfTransferSheet.tsx`**
- Bottom sheet similar to `PartnerTransferSheet`
- Fields: **Partner** (select team member), **Direction** (Withdraw / Deposit toggle), **Amount**, **Date**, **Notes**
- Withdraw = expense(online) + income(cash) on same partner
- Deposit = expense(cash) + income(online) on same partner
- Company bank accounts only show Deposit/Withdraw with online side forced
- Uses existing `addPartnerTransfer` store method (from and to partner are the same, but payment methods differ)

**2. Store change: `src/lib/store.ts`**
- Add `addSelfTransfer` method that creates two linked transactions on the same `handledBy` but with opposite payment methods
- Vendor label: `"Self Transfer"` to distinguish from team transfers
- Title: `"Bank Withdrawal"` / `"Bank Deposit"` for clarity

**3. UI entry point: `src/components/PartnerBalanceCard.tsx`**
- Add a small "↔ Transfer" button on each partner's balance card that opens the self-transfer sheet pre-filled with that partner

**4. Exclusion from totals**
- Self-transfer transactions (vendor = `"Self Transfer"`) should be excluded from org-wide totals, same as partner transfers — check existing exclusion logic in `store.ts` and extend if needed

### Files to create/modify

| File | Change |
|---|---|
| `src/components/SelfTransferSheet.tsx` | New — bottom sheet with partner, direction, amount, date, notes |
| `src/lib/store.ts` | Add `addSelfTransfer` method; extend transfer exclusion filter |
| `src/components/PartnerBalanceCard.tsx` | Add "Transfer" button per partner to open self-transfer sheet |
| `src/components/Dashboard.tsx` | Import and render `SelfTransferSheet` |




## Fix: Team Transfer Partner Selection Bug (Company Account Collision)

### Root Cause
Same `userId` collision pattern in `PartnerTransferSheet.tsx`. When clicking "Sanjay Singh":

1. **Line 212**: `setFromPartnerId(partner.userId || partner.id)` — for the company account, `partner.userId` is Sanjay's auth ID, so both Sanjay and the company account resolve to the same value
2. **Line 277**: Same issue for `setToPartnerId`
3. **Lines 38-39**: `partners.find((p) => (p.userId || p.id) === fromPartnerId)` — finds the company account first (or vice versa) since both share the same `userId`
4. **Lines 215, 280**: `disabled={partner.id === toPartnerId}` — compares `partner.id` to a `userId` value, so the disable check never matches correctly

### Fix
Apply the same pattern used in AddTransactionSheet/EditTransactionSheet: for company accounts, always use `partner.id` as the identifier.

**`src/components/PartnerTransferSheet.tsx`** — 6 changes:

| Line | Current | Fixed |
|---|---|---|
| 38 | `partners.find((p) => (p.userId \|\| p.id) === fromPartnerId)` | `partners.find((p) => p.userId === fromPartnerId \|\| p.id === fromPartnerId)` |
| 39 | Same pattern for `toPartnerId` | Same fix |
| 212 | `setFromPartnerId(partner.userId \|\| partner.id)` | `setFromPartnerId(partner.isCompanyAccount ? partner.id : (partner.userId \|\| partner.id))` |
| 215 | `disabled={partner.id === toPartnerId}` | `disabled={(partner.isCompanyAccount ? partner.id : (partner.userId \|\| partner.id)) === toPartnerId}` |
| 218 | highlight check `fromPartnerId === (partner.userId \|\| partner.id)` | Same fix using company account check |
| 277 | `setToPartnerId(partner.userId \|\| partner.id)` | Same company account fix |
| 280 | `disabled={partner.id === fromPartnerId}` | Same fix |
| 283 | highlight check | Same fix |

### File to modify
| File | Change |
|---|---|
| `src/components/PartnerTransferSheet.tsx` | Use `partner.id` for company accounts in all selection, lookup, highlight, and disable logic |


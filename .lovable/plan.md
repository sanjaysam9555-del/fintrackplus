

## Fix: Company Bank Account Showing Partner's Balance

### Root Cause
In `getPartnerBalancesForPeriod`, the transaction filter is:
```typescript
t.handledBy === partner.userId || t.handledBy === partner.id
```

The company bank account's `userId` is the owner's auth ID (same as Sanjay's personal partner). So **all of Sanjay's transactions** (where `handledBy === sanjay's userId`) are also counted toward the company bank account's balance via the `partner.userId` match.

### Fix
For company accounts, only match transactions on `partner.id` (never on `partner.userId`):

```typescript
const matchesPartner = (t: Transaction) => {
  if (partner.isCompanyAccount) {
    return t.handledBy === partner.id;
  }
  return t.handledBy === partner.userId || t.handledBy === partner.id;
};
```

This ensures the company bank account only includes transactions explicitly assigned to it, not all transactions from the owner.

### File to modify
| File | Change |
|---|---|
| `src/lib/store.ts` | Update `getPartnerBalancesForPeriod` to skip `userId` matching for company accounts |


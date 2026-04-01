

## Remove Company Bank Account from System (Without Deleting Data)

### Problem
A partner record with `is_company_account = true` exists in the database alongside the owner's personal partner record. Both share the same `user_id`, causing the owner to appear twice in Financial Holdings with identical balances.

### Approach
Filter out company account partners during sync so they never reach the frontend. The DB record stays intact — no data deletion. This is a single-line change.

### Fix

**`src/lib/syncEngine.ts`** (line ~526):
Add a `.filter()` before `.map()` on the partners array to exclude any partner where `is_company_account` is `true`:

```ts
partners: cloudPartners
  .filter(p => !(p as { is_company_account?: boolean }).is_company_account)
  .map(p => {
    // ... existing mapping
  }),
```

### Files to modify
| File | Change |
|---|---|
| `src/lib/syncEngine.ts` | Add filter to exclude `is_company_account = true` partners from cloud data mapping |


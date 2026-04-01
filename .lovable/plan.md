

## Fix: Company Bank Account Name Overwritten by Owner's Profile Name

### Root Cause
In `src/lib/syncEngine.ts` line 530, when mapping cloud partner data:
```typescript
name: linkedProfile?.name || (p as { name: string }).name
```
The company account shares the same `user_id` as the owner. So `linkedProfile` resolves to the owner's profile, and the company account's custom name (e.g. "Company Bank") gets replaced with "Sanjay Singh".

Same issue on line 534 for `avatarUrl`.

### Fix
Skip the profile name/avatar override for company accounts — always use the value stored in the `partners` table.

**`src/lib/syncEngine.ts`** (lines 526-539):
```typescript
partners: cloudPartners.map(p => {
  const isCompany = (p as { is_company_account?: boolean }).is_company_account;
  const linkedProfile = isCompany ? undefined : profileByUserId.get((p as { user_id?: string }).user_id);
  return {
    id: (p as { id: string }).id,
    name: linkedProfile?.name || (p as { name: string }).name,
    // ... rest unchanged
    avatarUrl: linkedProfile?.avatar_url || (p as { avatar_url?: string }).avatar_url || undefined,
    // ... rest unchanged
  };
}),
```

### File to modify
| File | Change |
|---|---|
| `src/lib/syncEngine.ts` | Skip profile lookup for company accounts so their custom name and avatar are preserved |


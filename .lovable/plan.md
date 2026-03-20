

## Rename Partners to Financial Holdings & Unify Identity via `handled_by`

### Overview

Replace the `partner_id` column on transactions with a `handled_by` column that stores the auth `user_id` directly (no indirection through `partners.id`). Add a `role` column to the `partners` table. Rename all UI labels. Ensure all org members (owners, admins, employees) have a partner/financial-holdings record.

---

### Database Migration

```sql
-- 1. Add 'handled_by' column (stores auth user_id directly)
ALTER TABLE public.transactions ADD COLUMN handled_by uuid;

-- 2. Migrate existing data: map partner_id → partners.user_id
UPDATE public.transactions t
SET handled_by = p.user_id
FROM public.partners p
WHERE t.partner_id = p.id;

-- 3. Add 'role' column to partners
ALTER TABLE public.partners ADD COLUMN role text DEFAULT 'owner';

-- 4. Populate role from org_members
UPDATE public.partners p
SET role = om.role::text
FROM public.org_members om
WHERE p.user_id = om.user_id AND om.status = 'active';

-- 5. Drop old FK and partner_id column
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_partner_id_fkey;
ALTER TABLE public.transactions DROP COLUMN partner_id;
```

---

### Code Changes

**1. `src/lib/types.ts`** — Transaction interface: rename `partnerId` → `handledBy` (stores user_id). Partner interface: add `role?: string`.

**2. `src/lib/store.ts`** — All references to `partnerId` → `handledBy`. All DB mappings `partner_id` → `handled_by`. Balance calculations: filter by `t.handledBy === partner.userId` instead of `t.partnerId === partner.id`. Update `addPartnerTransfer` similarly.

**3. `src/lib/syncEngine.ts`** — Map `handled_by` ↔ `handledBy`. Remove `partner_id` references.

**4. `src/hooks/useCloudSync.ts`** — Map `handled_by` instead of `partner_id`.

**5. `src/components/AddTransactionSheet.tsx`** & **`EditTransactionSheet.tsx`** — "Handled By" dropdown: show all org members from `partners` array. Set `handledBy` to `partner.userId` (auth uid) instead of `partner.id`. Rename "Partner" label to "Handled By".

**6. `src/components/TransactionItem.tsx`** & **`TransactionDetailSheet.tsx`** — Look up partner by `partners.find(p => p.userId === transaction.handledBy)` instead of by `id`.

**7. `src/components/PartnerBalanceCard.tsx`** — Rename "Partner Balances" → "Financial Holdings". Rename "Transfer Between Partners" → "Transfer Between Team".

**8. `src/components/PartnerTransferSheet.tsx`** — Rename title to "Transfer Between Team". Show all members. Use `handledBy` (user_id) instead of `partnerId`.

**9. `src/components/settings/PartnersSection.tsx`** — Rename header to "Financial Holdings". Show ALL org members. Transfer button → "Transfer Between Team".

**10. `src/components/SettingsPage.tsx`** — Rename menu item "Partners" → "Financial Holdings".

**11. `supabase/functions/manage-team/index.ts`** — When creating any member (not just owners), create a `partners` row with appropriate `role`. On remove_member, update `transactions SET handled_by = null` instead of `partner_id = null`.

**12. `src/components/settings/ChangeApprovalPage.tsx`** — Update `partner_id` references to `handled_by`.

**13. `src/components/InstallmentConfirmForm.tsx`** — Rename `partnerId` → `handledBy`.

**14. `src/hooks/useUserRole.ts`** — `canViewPartners` already restricts to owners only. No change needed.

---

### Files to Modify

| File | Change |
|---|---|
| New migration | Add `handled_by`, migrate data, add `role`, drop `partner_id` |
| `src/lib/types.ts` | `partnerId` → `handledBy`, add `role` to Partner |
| `src/lib/store.ts` | All partner_id/partnerId refs → handled_by/handledBy |
| `src/lib/syncEngine.ts` | DB column mapping |
| `src/hooks/useCloudSync.ts` | DB column mapping |
| `src/components/AddTransactionSheet.tsx` | Dropdown + field rename |
| `src/components/EditTransactionSheet.tsx` | Dropdown + field rename |
| `src/components/TransactionItem.tsx` | Partner lookup by userId |
| `src/components/TransactionDetailSheet.tsx` | Partner lookup by userId |
| `src/components/PartnerBalanceCard.tsx` | UI rename |
| `src/components/PartnerTransferSheet.tsx` | UI rename + handledBy |
| `src/components/settings/PartnersSection.tsx` | UI rename to "Financial Holdings" |
| `src/components/SettingsPage.tsx` | Menu label rename |
| `src/components/settings/ChangeApprovalPage.tsx` | partner_id → handled_by |
| `src/components/InstallmentConfirmForm.tsx` | partnerId → handledBy |
| `supabase/functions/manage-team/index.ts` | Create partner for all roles, use handled_by |




## Fix Employee Data Visibility, Dropdown & Project Access

### Issues
1. **Employees see all transactions** — No client-side filtering exists; RLS returns all org transactions
2. **Employees see all projects** — No filtering by `assigned_employee_ids`
3. **Employee missing from "Handled By" dropdown** — Only `partners` records are shown; employees without a partner record don't appear
4. **Employees can't INSERT transactions** — RLS only allows owners/admins to insert; employees need insert permission for their own transactions
5. **Financial Holdings (Partners) should show all org members** — Currently only shows partner records (owners)

---

### Step 1: Add `userId` to Transaction type and map it

**`src/lib/types.ts`** — Add `userId?: string` to the `Transaction` interface.

**`src/hooks/useCloudSync.ts`** — Map `t.user_id` → `userId` in the transaction cloud fetch mapping.

**`src/lib/syncEngine.ts`** — Map `user_id` ↔ `userId` in sync engine.

### Step 2: Filter transactions for employees (client-side)

**`src/components/Dashboard.tsx`** — Filter `filteredTransactions` to only show `t.userId === userId` when `isEmployee`.

**`src/components/TransactionList.tsx`** — Accept `isEmployee` prop; filter transactions where `t.userId === userId` when employee.

**`src/pages/Index.tsx`** — Pass `isEmployee` to `TransactionList`.

### Step 3: Filter projects for employees (client-side)

**`src/components/ProjectOverviewPage.tsx`** — When `isEmployee`, filter projects to only those where `assignedEmployeeIds` includes the current user's ID.

**`src/pages/Index.tsx`** — Already passes `userId`; just need `isEmployee` passed to `ProjectOverviewPage`.

**`src/components/AddTransactionSheet.tsx`** / **`EditTransactionSheet.tsx`** — Filter the project dropdown for employees to only assigned projects.

### Step 4: Allow employees to INSERT transactions (RLS)

**Database migration** — Add a new RLS policy on `transactions`:
```sql
CREATE POLICY "Employees can insert own transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (
    org_id = get_user_org_id(auth.uid())
    AND user_id = auth.uid()
  );
```
This allows any org member (including employees) to insert transactions tagged with their own `user_id`.

### Step 5: Ensure all org members appear in "Handled By" dropdown

The `manage-team` edge function should already create partner records for all new members (done in previous implementation). For the existing employee "Akash Kushwaha" who has no partner record, we need a **backfill migration**:

```sql
INSERT INTO public.partners (user_id, name, org_id, role)
SELECT om.user_id, p.name, om.org_id, om.role::text
FROM public.org_members om
JOIN public.profiles p ON p.user_id = om.user_id
WHERE om.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.partners pt 
    WHERE pt.user_id = om.user_id AND pt.org_id = om.org_id
  );
```

### Step 6: Financial Holdings shows all org members (visible only to owners)

**`src/components/settings/PartnersSection.tsx`** — Already restricted to owners via `canViewPartners`. No change needed for visibility. The backfill in Step 5 ensures admins/employees appear as financial records here too.

---

### Files to modify

| File | Change |
|---|---|
| New migration | Employee INSERT policy on transactions + backfill missing partner records |
| `src/lib/types.ts` | Add `userId` to Transaction |
| `src/hooks/useCloudSync.ts` | Map `user_id` → `userId` |
| `src/lib/syncEngine.ts` | Map `user_id` ↔ `userId` |
| `src/components/Dashboard.tsx` | Filter transactions for employees |
| `src/components/TransactionList.tsx` | Accept `isEmployee`, filter transactions |
| `src/components/ProjectOverviewPage.tsx` | Accept `isEmployee`, filter projects |
| `src/components/AddTransactionSheet.tsx` | Accept `isEmployee`+`userId`, filter projects dropdown |
| `src/components/EditTransactionSheet.tsx` | Same as above |
| `src/pages/Index.tsx` | Pass `isEmployee` to TransactionList, ProjectOverviewPage, AddTransactionSheet |


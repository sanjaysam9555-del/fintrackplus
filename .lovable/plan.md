

## Fix Employee Data Leaks: Graph Totals, AI Summary Access, Quick Actions

### Issues Found

1. **TransactionList `total` (line 63-65)** uses `getTotalIncome`/`getTotalExpense` which aggregate ALL org transactions — employees see the full business total in the header and chart total.
2. **DesktopSidebar** always renders the "AI Summary" nav item regardless of role — employees can click it.
3. **Dashboard quick actions** show "Logs" and "Reports" to employees, which per the role rules they shouldn't access.

Dashboard summary cards and cashflow chart are already hidden for employees (lines 262, 299). Transaction filtering is correct. The AI button on the dashboard is already hidden (lines 169, 225).

### Changes

**1. `src/components/TransactionList.tsx`** — Compute `total` from `filteredTransactions` instead of `getTotalIncome`/`getTotalExpense`

Replace lines 63-65:
```typescript
const total = useMemo(() => {
  return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
}, [filteredTransactions]);
```

This ensures employees only see the sum of their own filtered transactions, and owners/admins see the full org total (since their `filteredTransactions` isn't filtered by userId).

**2. `src/components/DesktopSidebar.tsx`** — Accept `isEmployee` prop and hide "AI Summary" nav item for employees

- Add `isEmployee?: boolean` to `DesktopSidebarProps`
- Conditionally filter the Tools section to exclude AI Summary when `isEmployee`

**3. `src/pages/Index.tsx`** — Pass `isEmployee` to `DesktopSidebar`

**4. `src/components/Dashboard.tsx`** — Filter quick actions for employees

- Hide "Logs" and "Reports" quick action buttons when `isEmployee` is true (per role rules: employees cannot view logs or reports)

**5. `src/pages/Index.tsx`** — Block employee navigation to AI view

- In `handleNavigate` and `handleTabChange`, prevent employees from reaching the 'ai' viewMode (defensive guard in case they somehow trigger it)

---

### Files to modify

| File | Change |
|---|---|
| `src/components/TransactionList.tsx` | Compute total from filtered data |
| `src/components/DesktopSidebar.tsx` | Accept `isEmployee`, hide AI Summary |
| `src/components/Dashboard.tsx` | Hide Logs/Reports quick actions for employees |
| `src/pages/Index.tsx` | Pass `isEmployee` to sidebar; guard AI navigation |




## Fix Employee & Admin Permissions for Categories, Vendors & Transaction Visibility

### Problem
1. **Employees can access Categories & Vendors sections** — While the settings menu hides these items for employees, the components themselves have no role guards. If an employee navigates there (e.g. via direct URL or a cached state), they see full add/edit/delete controls and ALL org transactions within category/vendor detail views.
2. **Employees see all org transactions in detail views** — `CategoryDetailView` and `VendorsSection` detail views show every transaction in the org, not filtered to the employee's own.
3. **RLS allows employees to SELECT all categories/vendors/transactions** — The DB policies grant all org members `SELECT` access. While we can't restrict categories/vendors at DB level (employees need them for dropdowns), transaction visibility in detail views must be filtered client-side.

### Changes

**1. `src/components/settings/CategoriesSection.tsx`** — Accept `isEmployee` prop. Hide Add button, edit/delete actions for employees. In the category transaction counts and detail view, filter transactions to only the employee's own (`t.userId === userId`).

**2. `src/components/settings/CategoryDetailView.tsx`** — Accept `isEmployee` and `currentUserId` props. Filter `catTransactions` to only show `t.userId === currentUserId` when employee. Hide edit/delete buttons for employees.

**3. `src/components/settings/VendorsSection.tsx`** — Accept `isEmployee` prop. Hide Add button, edit/delete actions for employees. Filter vendor transaction stats to only the employee's own transactions. In the detail view, filter transactions similarly.

**4. `src/components/SettingsPage.tsx`** — Pass `isEmployee` to `CategoriesSection` and `VendorsSection`. Also, as a defensive guard, if an employee somehow reaches the categories/vendors section, redirect them back.

**5. `src/pages/Index.tsx`** — Defensive guard: if `isEmployee` and `settingsSection` is `categories`, `vendors`, or `labels`, reset to `null`.

### Summary of Role Permissions

| Feature | Owner | Admin | Employee |
|---|---|---|---|
| Categories: View list | Yes | Yes | No (hidden from menu) |
| Categories: Add/Edit/Delete | Yes | Yes | No |
| Categories: See all txn detail | Yes | Yes | No (own only) |
| Vendors: View list | Yes | Yes | No (hidden from menu) |
| Vendors: Add/Edit/Delete | Yes | Yes | No |
| Vendors: See all txn detail | Yes | Yes | No (own only) |
| Labels: View/Manage | Yes | Yes | No |

### Files to modify
- `src/components/settings/CategoriesSection.tsx` — Add `isEmployee` prop, hide CRUD actions, filter transactions
- `src/components/settings/CategoryDetailView.tsx` — Add `isEmployee`/`currentUserId` props, filter transactions, hide edit/delete
- `src/components/settings/VendorsSection.tsx` — Add `isEmployee` prop, hide CRUD actions, filter transactions
- `src/components/SettingsPage.tsx` — Pass `isEmployee` to sub-components, add defensive guard
- `src/pages/Index.tsx` — Defensive guard for employee settings navigation


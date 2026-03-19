

# Multi-User Roles & Team Management — Detailed Plan

## Overview

Transform the single-user app into a team-based system where the Owner signs up, then can add up to 2 more members (3 total) via Settings. Each member gets a role (Owner, Admin, Employee) that controls what they see and do.

---

## User Flows

### 1. Owner Signup & Team Creation
- Owner signs up normally. An `organization` is auto-created (via DB trigger). Owner is added to `org_members` with role `owner` and also auto-created as a Partner.
- All existing data is associated with this org via `org_id`.

### 2. Adding Members (Owner only)
- In Settings, only Owners see a "Team" section.
- Owner enters: email, name, selects role (Owner / Admin / Employee) from dropdown, clicks Save.
- An edge function (`manage-team`) creates the user account with a temporary password using the service role key.
- The temporary password is displayed to the Owner (copy-to-clipboard) to share manually.
- If the role is Owner, a Partner entry is also auto-created for that user.

### 3. First Login with Temporary Password
- When the new member logs in with the temp password, they are forced to change it.
- This is handled by setting a flag `must_change_password` in `org_members`. The app checks this flag on login and shows a mandatory password change screen before allowing access.

### 4. Role-Based Behavior

#### Owner
- Full app access — dashboard, all tabs, settings, reports, AI summary, logs.
- Can add/edit/delete team members.
- Can see all Partners and their balances.
- **Cross-partner protection**: An Owner/Partner can freely edit/delete their own income/expense entries. If they try to edit or delete another Partner's entry, the change is NOT applied immediately — it is submitted as a pending change request.

#### Admin
- Full app access like Owner EXCEPT:
  - Cannot see Partners section or partner balances.
  - Cannot add/edit/delete team members.
  - Cannot see Logs.
- Can add/edit/delete transactions, projects, categories, vendors.

#### Employee
- **Home tab**: No summary callout cards (total income, expense, balance, net). No cashflow trend chart. No AI Summary button.
- **Expense tab**: Only sees expenses logged by them. Total Expense graph reflects only their expenses.
- **Income tab**: Only sees income logged by them. Total Income graph reflects only their income.
- **Projects**: Only sees projects assigned to them. Within a project, only their income/expense entries. No Net Margin shown. Cannot add/edit/delete projects.
- **Settings**: No Partners, no Reports, no Logs.
- Cannot add/edit/delete categories, vendors, or partners.

### 5. Cross-Partner Entry Protection (Owner-to-Owner)
- When Owner A edits/deletes an entry that belongs to Owner B (based on `partner_id` matching the other owner's partner record), the change is saved as a **pending approval** rather than applied.
- A new `change_approvals` table stores: `id`, `org_id`, `requester_user_id`, `target_user_id` (the partner whose entry is affected), `entity_type` (transaction/partner), `entity_id`, `action` (edit/delete), `proposed_changes` (JSONB of field changes), `status` (pending/approved/rejected), `created_at`.
- The affected partner sees pending approvals in Settings → "Change Approval" page.
- On approval: the edit/delete is applied. On rejection: the request is discarded.
- Success toast on submission: "Change submitted for approval."
- Deleting a Partner also requires approval from the other Partner.

### 6. Project Assignment for Employees
- Project add/edit form gets a new multi-select dropdown: "Assign Employees."
- Lists all Employee-role members in the org.
- Stored as `assigned_employee_ids` (JSONB array) on the `projects` table.
- Employee's project list is filtered to only show projects where their user_id is in `assigned_employee_ids`.

---

## Database Changes

### New Tables

| Table | Columns | Notes |
|-------|---------|-------|
| `organizations` | `id`, `name`, `owner_id`, `max_members` (default 3), `created_at` | One per signup |
| `org_members` | `id`, `org_id`, `user_id`, `role` (enum: owner/admin/employee), `must_change_password` (bool), `status` (active/disabled), `created_at` | Max 3 per org |
| `change_approvals` | `id`, `org_id`, `requester_user_id`, `target_user_id`, `entity_type`, `entity_id`, `action`, `proposed_changes` (JSONB), `status` (pending/approved/rejected), `created_at`, `resolved_at` | Cross-partner edits |

### Modified Tables

| Table | Change |
|-------|--------|
| All data tables (transactions, categories, vendors, projects, partners, project_labels, project_documents, notifications, profiles) | Add `org_id` column (uuid, NOT NULL after backfill) |
| `projects` | Add `assigned_employee_ids` (JSONB, default `[]`) |

### New Enum
```sql
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'employee');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
```

### Security Definer Functions
- `get_user_org_id(uuid)` → returns org_id
- `get_user_role(uuid)` → returns role
- Both `SECURITY DEFINER` to avoid RLS recursion

### RLS Policy Overhaul
All data tables switch from `auth.uid() = user_id` to `get_user_org_id(auth.uid()) = org_id` for SELECT. INSERT/UPDATE/DELETE add role checks:
- SELECT: all org members can view
- INSERT/UPDATE/DELETE: role must be `owner` or `admin` (employees blocked at DB level too)

### Triggers
- On new user signup: create organization + org_member (owner) + partner entry
- Backfill migration: for existing users, create org, org_member, set org_id on all their data

---

## Edge Function: `manage-team`

Handles Owner-only operations via service role key:
- **Create member**: Validates org has < 3 members. Creates auth user with `supabase.auth.admin.createUser()`. Inserts org_member. If role is Owner, also creates a Partner. Returns temp password.
- **Update role**: Change member's role (not self). If changing to Owner, create Partner if not exists.
- **Remove member**: Delete from org_members, disable auth account. If removing Owner, require approval.
- **JWT verification**: Validates caller is an Owner in the same org.

---

## Frontend Changes

### New Files
| File | Purpose |
|------|---------|
| `src/hooks/useUserRole.ts` | Hook that fetches current user's role from org_members. Exposes `role`, `isOwner`, `isAdmin`, `isEmployee`, `canEdit`, `canManageTeam`, `orgId` |
| `src/components/settings/TeamSection.tsx` | Team management UI for Owners: list members, add member form (email, name, role dropdown, save), show temp password modal, remove member |
| `src/components/settings/ChangeApprovalPage.tsx` | Lists pending change approvals for the current Owner/Partner. Approve/reject buttons. |
| `src/components/ForcePasswordChange.tsx` | Mandatory password change screen shown after first login with temp password |

### Modified Files
| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Wrap with role context. Pass role info to child components. Show ForcePasswordChange if `must_change_password` is true. |
| `src/components/Dashboard.tsx` | Employee: hide SummaryCards, CashFlowChart, AI summary button |
| `src/components/TransactionList.tsx` | Employee: filter transactions to only `user_id = current user`. Hide add/edit/delete buttons. |
| `src/components/SettingsPage.tsx` | Employee: hide Partners, Reports, Logs. Admin: hide Partners, Logs, Team. Owner: show Team section + Change Approval. |
| `src/components/ProjectOverviewPage.tsx` | Employee: filter to assigned projects only. Hide net margin. Hide add/edit/delete project buttons. |
| `src/components/settings/ProjectsSection.tsx` | Add "Assign Employees" multi-select dropdown in project form |
| `src/components/AddTransactionSheet.tsx` | Employee: blocked (canEdit = false). Owner editing another partner's entry → submit for approval instead of direct save. |
| `src/components/EditTransactionSheet.tsx` | Owner editing another partner's entry → submit for approval. Show toast "Change submitted for approval." |
| `src/lib/store.ts` | Update sync to use org_id. Add change approval operations. |
| `src/hooks/useSyncEngine.ts` | Fetch data by org_id (RLS handles this automatically). Remove explicit user_id filters. |
| `src/lib/syncEngine.ts` | Update fetchAllCloudData to work with org-scoped RLS |

---

## Implementation Order

1. Database migration: enums, tables, functions, triggers, org_id columns, backfill, RLS overhaul
2. Edge function: `manage-team`
3. `useUserRole` hook + ForcePasswordChange screen
4. Team management UI in Settings
5. Role-based UI gating across all screens (Dashboard, Transactions, Projects, Settings)
6. Change Approval system (table, UI, approval/rejection flow)
7. Project employee assignment dropdown
8. Testing and edge case handling


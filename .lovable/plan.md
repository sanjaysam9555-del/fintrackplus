

## Approval Workflow for Partner & Team Member Deletion

### What Changes

**Core behavior**: When an owner tries to delete a partner or remove a team member, instead of executing immediately, a change approval request is created. The request is visible to all owners but can only be approved/rejected by a *different* owner (not the requester). Once resolved, it shows status to both.

**Logging**: All notifications/logs include the acting user's name (e.g., "Ravi requested deletion of Swati Sharma", "Swati approved deletion of Partner X").

---

### Step 1: Update ChangeApprovalPage to show all approvals (not just pending)

**File**: `src/components/settings/ChangeApprovalPage.tsx`

- Remove `.eq('target_user_id', user.id)` filter — show all org approvals (RLS already scopes to org)
- Remove `.eq('status', 'pending')` filter — show all statuses for tracking
- Add tabs/sections: "Pending" and "History"
- For pending items: hide Approve/Reject buttons if `requester_user_id === current user` (can't approve own request)
- Show status badges (pending/approved/rejected) on history items
- Show resolver name on resolved items

### Step 2: Intercept partner deletion with approval flow

**File**: `src/components/settings/PartnersSection.tsx`

- Replace `handleDelete` → instead of calling `deletePartner()` directly, check if there are other owners in the org
- If other owners exist: create a `change_approvals` row with `entity_type: 'partner'`, `action: 'delete'`, and set `target_user_id` to any other owner (or we can leave it org-wide since we're removing that filter)
- Show toast: "Deletion request sent for approval"
- Add notification with requester's name

### Step 3: Intercept team member removal with approval flow

**File**: `src/components/settings/TeamSection.tsx`

- Replace `handleRemoveMember` → instead of calling the edge function directly, create a `change_approvals` row with `entity_type: 'team_member'`, `action: 'delete'`
- Show toast: "Removal request sent for approval"

### Step 4: Handle team_member approval execution in ChangeApprovalPage

**File**: `src/components/settings/ChangeApprovalPage.tsx`

- Add case for `entity_type === 'team_member'` + `action === 'delete'`: invoke `manage-team` edge function with `remove_member` action when approved

### Step 5: Add user names to notifications

**File**: `src/lib/store.ts` (notification messages) + `src/components/settings/PartnersSection.tsx` + `src/components/settings/TeamSection.tsx`

- Pass the current user's profile name into notification messages so logs read: "Ravi requested deletion of Partner X" / "Swati approved deletion of Partner X"
- The `ChangeApprovalPage` will also log approval/rejection with names

### Step 6: Update change_approvals RLS for broader insert access

Currently only owners can insert. This is fine since both partners in this flow are owners. But we need to ensure `target_user_id` is not strictly filtered on SELECT (already handled by removing the filter in Step 1 — RLS allows org-wide SELECT).

---

### Technical Details

**Files to modify:**
- `src/components/settings/ChangeApprovalPage.tsx` — Show all org approvals, tabs, self-approval guard, team_member handling
- `src/components/settings/PartnersSection.tsx` — Intercept delete → create approval request
- `src/components/settings/TeamSection.tsx` — Intercept remove → create approval request
- `src/lib/store.ts` — No schema change needed; notifications already support names in messages

**No database migration needed** — `change_approvals` table already supports `entity_type` as free text, and RLS already allows org-wide SELECT.


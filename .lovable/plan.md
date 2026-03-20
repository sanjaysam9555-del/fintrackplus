

## Route Transaction Edits/Deletes Through Approval When Entry Belongs to Another Owner

### Problem
When an owner/partner edits or deletes a transaction that was created or handled by another owner/partner, the change applies immediately — bypassing the approval system entirely. The approval flow only exists for partner/team member deletions today.

### Solution
Add approval checks in two places:
1. **Edit** — in `EditTransactionSheet.tsx`, before calling `updateTransaction`, check if the transaction's `handledBy` (or `userId`) belongs to a different owner. If so, insert a `change_approvals` row instead of applying the edit.
2. **Delete** — in `TransactionDetailSheet.tsx`, before calling `deleteTransaction`, same check. Route to approval if it belongs to another owner.

### Logic
- Fetch `otherOwners` from `org_members` (same pattern used in `PartnersSection`)
- A transaction "belongs to another owner" if `transaction.handledBy !== currentUser.id` AND `transaction.handledBy` is an owner's `user_id` (i.e., exists in `org_members` with role `owner`)
- If there are other owners and the transaction belongs to one of them, create a `change_approvals` entry targeting that owner
- If the transaction belongs to the current user, or there's only one owner, apply directly as today

### Files to modify

| File | Change |
|---|---|
| `src/components/EditTransactionSheet.tsx` | In `handleSubmit`, check if transaction belongs to another owner. If yes, insert `change_approvals` with `action: 'edit'`, `entity_type: 'transaction'`, and `proposed_changes` containing the updates. Show toast "Edit request sent for approval" and close sheet. |
| `src/components/TransactionDetailSheet.tsx` | In `handleDelete`, check if transaction belongs to another owner. If yes, insert `change_approvals` with `action: 'delete'`, `entity_type: 'transaction'`. Show toast "Delete request sent for approval" and close sheet. Skip the undo toast in this case. |
| `src/components/settings/ChangeApprovalPage.tsx` | Already handles `edit` and `delete` for `transaction` entity type in `handleApproval` — no changes needed. |

### Approval check pattern (used in both files)
```typescript
// Fetch other owners in the org
const { data: owners } = await supabase
  .from('org_members')
  .select('user_id')
  .eq('org_id', orgId)
  .eq('role', 'owner')
  .eq('status', 'active');

const otherOwners = (owners || []).filter(o => o.user_id !== user.id);
const txnOwnerUserId = transaction.handledBy || transaction.userId;
const belongsToAnotherOwner = otherOwners.some(o => o.user_id === txnOwnerUserId);

if (belongsToAnotherOwner && otherOwners.length > 0) {
  // Route to approval
  await supabase.from('change_approvals').insert({
    org_id: orgId,
    requester_user_id: user.id,
    target_user_id: txnOwnerUserId,
    entity_type: 'transaction',
    entity_id: transaction.id,
    action: 'edit', // or 'delete'
    proposed_changes: { ...updates, name: transaction.title || transaction.vendor },
    status: 'pending'
  });
  toast.success('Edit request sent for approval');
  onClose();
  return;
}
```

Both components already import `useAuth`/`useUserRole` or can access `userId`. They'll need `supabase` import and `orgId` from `useUserRole()`.


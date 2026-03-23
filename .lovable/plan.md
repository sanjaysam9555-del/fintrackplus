

## Fix: Approved Changes Not Applied to Transactions

### Root Cause
When an edit is approved in `ChangeApprovalPage.tsx`, the code does:
```typescript
await supabase.from('transactions').update(approval.proposed_changes).eq('id', approval.entity_id);
```

The `proposed_changes` object is stored with **camelCase** keys (e.g. `categoryId`, `paymentMethod`, `handledBy`) because it's saved directly from the edit form. But the database uses **snake_case** columns (`category_id`, `payment_method`, `handled_by`). The update silently does nothing because no column names match.

### Fix
**`src/components/settings/ChangeApprovalPage.tsx`** — Add a camelCase-to-snake_case mapping before applying the approved changes to the database.

Map these keys before the update call:
- `categoryId` → `category_id`
- `projectId` → `project_id`
- `handledBy` → `handled_by`
- `paymentMethod` → `payment_method`
- `receiptUrl` → `receipt_url`
- `isGst` → `is_gst`

Keep `type`, `amount`, `title`, `vendor`, `date`, `notes` as-is (they match DB columns). Remove the `name` key (display-only, not a DB column).

### Files to modify
| File | Change |
|---|---|
| `src/components/settings/ChangeApprovalPage.tsx` | Convert camelCase proposed_changes to snake_case before applying to DB on approval |




# Enhanced Activity Logs with Change Details

## Problem

Currently, the activity logs in Settings only show basic information like:
- **Transaction Updated**: "Vendor Name - ₹1,000"

This doesn't explain **what changed**. Users can't understand:
- Which fields were modified
- What the old values were vs new values
- Context about the change (category, project, payment method, etc.)

---

## Solution

Enhance the notification system to capture and display detailed change information:

1. **Expand the Notification type** to include an optional `details` field for structured change data
2. **Capture "before" state** when updating entities and compare with "after" state
3. **Display change details** in the logs UI with a "from → to" format
4. **Add relevant context** like category names, project names, payment methods

---

## Visual Design

### Current Log Entry
```
+------------------------------------------+
| [📝] Transaction Updated                 |
|       Amazon - ₹5,000                    |
|       2 hours ago                        |
+------------------------------------------+
```

### Enhanced Log Entry
```
+------------------------------------------+
| [📝] Transaction Updated                 |
|       Amazon - ₹5,000                    |
|       ┌─────────────────────────────┐    |
|       │ Amount: ₹3,000 → ₹5,000     │    |
|       │ Category: Food → Shopping   │    |
|       │ Payment: Cash → Online      │    |
|       └─────────────────────────────┘    |
|       2 hours ago                        |
+------------------------------------------+
```

---

## Technical Changes

### 1. Update Notification Type

**File: `src/lib/types.ts`**

Add an optional `details` field to store structured change information:

```typescript
export interface NotificationChange {
  field: string;      // e.g., "Amount", "Category", "Vendor"
  from: string;       // Previous value (formatted for display)
  to: string;         // New value (formatted for display)
}

export interface Notification {
  id: string;
  type: 'transaction' | 'export' | 'profile' | 'category' | 'vendor' | 'project' | 'delete' | 'edit' | 'partner';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  details?: NotificationChange[];  // Optional array of changes
  entityType?: string;             // 'transaction', 'category', etc.
  entityId?: string;               // ID of the affected entity
}
```

### 2. Modify Store to Capture Changes

**File: `src/lib/store.ts`**

Update the `updateTransaction` function to compare old vs new values and generate detailed change descriptions.

**Key changes to `updateTransaction` (lines 305-353):**

```typescript
updateTransaction: async (id, updates, userId) => {
  const transaction = get().transactions.find(t => t.id === id);
  const { categories, projects, partners } = get();
  
  // Helper to get readable names
  const getCategoryName = (catId?: string) => 
    categories.find(c => c.id === catId)?.name || 'None';
  const getProjectName = (projId?: string) => 
    projects.find(p => p.id === projId)?.name || 'None';
  const getPartnerName = (partnerId?: string) => 
    partners.find(p => p.id === partnerId)?.name || 'None';
  
  // Build change details
  const changes: Array<{ field: string; from: string; to: string }> = [];
  
  if (transaction) {
    if (updates.amount !== undefined && updates.amount !== transaction.amount) {
      changes.push({
        field: 'Amount',
        from: `₹${transaction.amount.toLocaleString()}`,
        to: `₹${updates.amount.toLocaleString()}`
      });
    }
    if (updates.type && updates.type !== transaction.type) {
      changes.push({
        field: 'Type',
        from: transaction.type === 'income' ? 'Income' : 'Expense',
        to: updates.type === 'income' ? 'Income' : 'Expense'
      });
    }
    if (updates.vendor && updates.vendor !== transaction.vendor) {
      changes.push({
        field: 'Vendor',
        from: transaction.vendor,
        to: updates.vendor
      });
    }
    if (updates.categoryId !== undefined && updates.categoryId !== transaction.categoryId) {
      changes.push({
        field: 'Category',
        from: getCategoryName(transaction.categoryId),
        to: getCategoryName(updates.categoryId)
      });
    }
    if (updates.projectId !== undefined && updates.projectId !== transaction.projectId) {
      changes.push({
        field: 'Project',
        from: getProjectName(transaction.projectId),
        to: getProjectName(updates.projectId)
      });
    }
    if (updates.partnerId !== undefined && updates.partnerId !== transaction.partnerId) {
      changes.push({
        field: 'Partner',
        from: getPartnerName(transaction.partnerId),
        to: getPartnerName(updates.partnerId)
      });
    }
    if (updates.paymentMethod && updates.paymentMethod !== transaction.paymentMethod) {
      changes.push({
        field: 'Payment',
        from: transaction.paymentMethod === 'cash' ? 'Cash' : 'Online',
        to: updates.paymentMethod === 'cash' ? 'Cash' : 'Online'
      });
    }
    if (updates.date && updates.date !== transaction.date) {
      changes.push({
        field: 'Date',
        from: transaction.date,
        to: updates.date
      });
    }
    if (updates.isGst !== undefined && updates.isGst !== transaction.isGst) {
      changes.push({
        field: 'GST',
        from: transaction.isGst ? 'Yes' : 'No',
        to: updates.isGst ? 'Yes' : 'No'
      });
    }
  }
  
  // Update local state
  set((state) => ({
    transactions: state.transactions.map((t) => 
      t.id === id ? { ...t, ...updates } : t
    )
  }));
  
  // ... sync queue logic ...
  
  if (transaction) {
    get().addNotification({
      type: 'edit',
      title: 'Transaction Updated',
      message: `${updates.vendor || transaction.vendor} - ₹${(updates.amount || transaction.amount).toLocaleString()}`,
      details: changes.length > 0 ? changes : undefined,
      entityType: 'transaction',
      entityId: id,
    });
  }
};
```

### 3. Apply Similar Logic to Other Entity Updates

**Category, Vendor, Project, Partner updates** will also capture:
- Name changes: "Old Name → New Name"
- Color changes (shown as a visual indicator)
- Budget/Margin changes for projects
- Balance changes for partners

### 4. Update SettingsPage to Display Changes

**File: `src/components/SettingsPage.tsx`**

Enhance the `NotificationsContent` component to render the `details` array:

```tsx
{notification.details && notification.details.length > 0 && (
  <div className="mt-2 p-2 bg-muted/50 rounded-lg space-y-1">
    {notification.details.map((change, i) => (
      <div key={i} className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground w-16 shrink-0">{change.field}:</span>
        <span className="text-muted-foreground line-through">{change.from}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-foreground font-medium">{change.to}</span>
      </div>
    ))}
  </div>
)}
```

### 5. Enhanced Delete Notifications

For delete actions, include relevant entity details:

```typescript
// Transaction delete
get().addNotification({
  type: 'delete',
  title: 'Transaction Deleted',
  message: `${transaction.vendor} - ₹${transaction.amount.toLocaleString()}`,
  details: [
    { field: 'Type', from: transaction.type === 'income' ? 'Income' : 'Expense', to: 'Deleted' },
    { field: 'Date', from: transaction.date, to: 'Deleted' },
    { field: 'Category', from: getCategoryName(transaction.categoryId), to: 'Deleted' },
  ],
});
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Add `NotificationChange` interface, update `Notification` type with `details`, `entityType`, `entityId` |
| `src/lib/store.ts` | Capture before/after changes in all update functions, enhance delete notifications |
| `src/components/SettingsPage.tsx` | Render change details in logs with "from → to" formatting |

---

## Example Log Entries After Implementation

| Action | Before | After |
|--------|--------|-------|
| Edit Amount | "Amazon - ₹5,000" | "Amazon - ₹5,000" + details: "Amount: ₹3,000 → ₹5,000" |
| Change Category | "Amazon - ₹5,000" | "Amazon - ₹5,000" + details: "Category: Food → Shopping" |
| Multiple Changes | "Amazon - ₹5,000" | Shows all changed fields in a compact list |
| Delete Transaction | "Amazon - ₹5,000" | "Amazon - ₹5,000" + details: Type, Date, Category info |


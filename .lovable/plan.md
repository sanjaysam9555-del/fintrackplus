

# Fix Vendor Editing: Update Transactions When Vendor Name Changes

## The Problem

When editing a vendor in Settings, the system creates a new vendor instead of properly updating the existing one. Additionally, when a vendor name changes, all transactions that reference the old vendor name are not updated.

There are two related issues:

1. **Legacy Vendors**: Vendors that exist only in transactions (not in the vendors table) get a `legacy-` prefix ID. When these are "edited", the code correctly creates a new vendor entry, but the original transaction vendor names remain unchanged.

2. **Regular Vendors**: When editing a vendor's name, the vendor record is updated, but transactions still reference the old vendor name in the `vendor` field (which stores the vendor name as a string, not an ID).

## Root Cause Analysis

The transaction schema stores `vendor` as a **text field** containing the vendor name directly, not as a foreign key reference to the vendors table. This means:
- When a vendor is renamed, transactions keep the old name
- The vendors table and transactions table are not properly linked

## Solution

When updating a vendor, also update all transactions that have the old vendor name to use the new vendor name.

---

## Implementation Plan

### File: `src/lib/store.ts`

**Modify the `updateVendor` function** to also update transactions with the old vendor name:

Current logic (lines 932-975):
```typescript
updateVendor: async (id, updates, userId) => {
  const vendor = get().vendors.find(v => v.id === id);
  // ... notification logic ...
  
  set((state) => ({
    vendors: state.vendors.map((v) => 
      v.id === id ? { ...v, ...updates } : v
    )
  }));
  
  // ... sync queue logic ...
}
```

Updated logic:
```typescript
updateVendor: async (id, updates, userId) => {
  const vendor = get().vendors.find(v => v.id === id);
  const oldVendorName = vendor?.name;
  
  // ... notification logic ...
  
  set((state) => ({
    vendors: state.vendors.map((v) => 
      v.id === id ? { ...v, ...updates } : v
    ),
    // Also update transactions that reference the old vendor name
    transactions: updates.name && oldVendorName && updates.name !== oldVendorName
      ? state.transactions.map((t) =>
          t.vendor === oldVendorName ? { ...t, vendor: updates.name } : t
        )
      : state.transactions
  }));
  
  // Queue vendor update
  if (userId) {
    addToSyncQueue({
      type: 'update',
      entity: 'vendor',
      entityId: id,
      data: updates,
      userId,
    });
    
    // If name changed, also queue transaction updates
    if (updates.name && oldVendorName && updates.name !== oldVendorName) {
      const affectedTransactions = get().transactions.filter(t => t.vendor === updates.name);
      for (const txn of affectedTransactions) {
        addToSyncQueue({
          type: 'update',
          entity: 'transaction',
          entityId: txn.id,
          data: { vendor: updates.name },
          userId,
        });
      }
    }
    
    get().updatePendingCount();
    
    if (navigator.onLine) {
      processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
    }
  }
  
  // ... notification ...
}
```

### File: `src/components/settings/VendorsSection.tsx`

**Modify the `handleUpdate` function** for legacy vendors to also update transactions:

Current logic (lines 97-101):
```typescript
if (id.startsWith('legacy-')) {
  addVendor(name.trim(), selectedColor, selectedIcon, userId);
} else {
  updateVendor(id, { name: name.trim(), color: selectedColor, icon: selectedIcon }, userId);
}
```

Updated logic:
```typescript
if (id.startsWith('legacy-')) {
  // For legacy vendors, we need to:
  // 1. Create a new vendor entry
  // 2. Update all transactions with the old name to use the new name
  const oldName = originalName; // The legacy vendor's original name
  const newName = name.trim();
  
  // Add the new vendor
  addVendor(newName, selectedColor, selectedIcon, userId);
  
  // Update transactions if name changed
  if (oldName && newName !== oldName) {
    // Get transactions with the old vendor name and update them
    const transactionsToUpdate = transactions.filter(t => t.vendor === oldName);
    transactionsToUpdate.forEach(t => {
      updateTransaction(t.id, { vendor: newName }, userId);
    });
  }
} else {
  updateVendor(id, { name: name.trim(), color: selectedColor, icon: selectedIcon }, userId);
}
```

This requires importing `updateTransaction` from the store.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/store.ts` | Update `updateVendor` to also update transactions referencing the old vendor name |
| `src/components/settings/VendorsSection.tsx` | Update `handleUpdate` for legacy vendors to update transactions with the old name |

---

## Expected Behavior After Fix

1. **Editing a regular vendor**: 
   - Vendor record updated in vendors table
   - All transactions with old vendor name updated to new name
   - Changes synced to database

2. **Editing a legacy vendor**:
   - New vendor record created in vendors table
   - All transactions with old vendor name updated to new name
   - Legacy vendor effectively "converted" to a real vendor

3. **Both cases**: User sees consistent vendor names across transactions and vendor list


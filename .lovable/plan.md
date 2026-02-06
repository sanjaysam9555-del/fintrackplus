

# Expand Vendor Payments to Show Individual Transactions

## Current Problem

| Issue | Current Behavior |
|-------|-----------------|
| **Aggregated Only** | Vendor section shows only totals: vendor name, count, amount, last date |
| **No Transaction Details** | Cannot see individual payments to a vendor |
| **No Edit Access** | Cannot edit/delete vendor transactions from this view |

**Current Vendor Display (lines 254-270):**
```
┌─────────────────────────────────────┐
│ Vendor Name                  ₹15,000│
│ 3 payments • Last: Jan 15          │
└─────────────────────────────────────┘
```

---

## Proposed Solution

Make each vendor card collapsible to reveal individual transactions:

```
┌─────────────────────────────────────┐
│ ▼ Vendor Name (3)            ₹15,000│
│   3 payments • Last: Jan 15         │
├─────────────────────────────────────┤
│ [TransactionItem] Jan 15    -₹7,000 │
│ [TransactionItem] Jan 10    -₹5,000 │
│ [TransactionItem] Jan 5     -₹3,000 │
└─────────────────────────────────────┘
```

**Features:**
- Vendor summary header remains visible (total amount, count, last date)
- Chevron indicator shows expandable state
- Clicking expands to show all transactions for that vendor
- Uses the standard `TransactionItem` component for consistency
- Each transaction can be edited/deleted just like in other sections

---

## Technical Implementation

### File to Modify

| File | Changes |
|------|---------|
| `src/components/ProjectDetailSheet.tsx` | Replace static vendor cards with collapsible sections containing TransactionItem list |

### Changes Required

1. **Add Collapsible import** from `@/components/ui/collapsible`
2. **Add ChevronDown icon** to vendor headers
3. **Track expanded state** for each vendor (useState with Set or object)
4. **Filter transactions by vendor** to get individual payments
5. **Render TransactionItem** for each vendor's transactions inside the collapsible

### Code Structure

```tsx
// Track which vendors are expanded
const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

const toggleVendor = (vendor: string) => {
  setExpandedVendors(prev => {
    const newSet = new Set(prev);
    if (newSet.has(vendor)) {
      newSet.delete(vendor);
    } else {
      newSet.add(vendor);
    }
    return newSet;
  });
};

// Get transactions for a specific vendor
const getVendorTransactions = (vendorName: string) => {
  return expenseTransactions.filter(t => t.vendor === vendorName);
};

// In render:
{vendorBreakdown.map((item) => {
  const isExpanded = expandedVendors.has(item.vendor);
  const vendorTxns = getVendorTransactions(item.vendor);
  
  return (
    <Collapsible
      key={item.vendor}
      open={isExpanded}
      onOpenChange={() => toggleVendor(item.vendor)}
    >
      <CollapsibleTrigger className="w-full">
        {/* Vendor summary header with chevron */}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {/* List of TransactionItem components */}
        {vendorTxns.map(txn => (
          <TransactionItem
            key={txn.id}
            transaction={txn}
            category={getCategoryById(txn.categoryId)}
            userId={userId}
            onEditSheetChange={onEditSheetChange}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
})}
```

---

## Visual Design

**Collapsed State:**
```
┌─────────────────────────────────────┐
│ ▶ Vendor Name           (3) ₹15,000 │
│   Last payment: Jan 15              │
└─────────────────────────────────────┘
```

**Expanded State:**
```
┌─────────────────────────────────────┐
│ ▼ Vendor Name           (3) ₹15,000 │
│   Last payment: Jan 15              │
├─────────────────────────────────────┤
│ │ [Category Icon] Payment Title     │
│ │ Vendor • Cash • 2:30 PM   -₹7,000 │
│ ├───────────────────────────────────│
│ │ [Category Icon] Payment Title     │
│ │ Vendor • Online • 10:15   -₹5,000 │
│ ├───────────────────────────────────│
│ │ [Category Icon] Payment Title     │
│ │ Vendor • Cash • 9:00 AM   -₹3,000 │
└─────────────────────────────────────┘
```

---

## Summary

| Before | After |
|--------|-------|
| Only totals shown | Individual transactions visible |
| No drill-down | Collapsible vendor sections |
| Cannot see payment dates | Each payment with full date/time |
| Cannot edit transactions | Full TransactionItem with edit/delete |
| Static display | Interactive accordion-style UI |


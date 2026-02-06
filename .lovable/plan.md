

# Improve Partners Section - Transaction Detail View and Clearer UI

## Current Problems

| Issue | Current State |
|-------|---------------|
| **No Transaction Visibility** | Clicking on a partner card doesn't show their transactions |
| **Confusing Layout** | Too much information crammed into small cards |
| **Unclear Purpose** | Users don't understand what the numbers mean |
| **No Detail Drill-Down** | Can't see which specific transactions a partner handled |

---

## Proposed Solution

### 1. Add Partner Detail Sheet (New Component)

Create a new `PartnerDetailSheet.tsx` similar to `ProjectDetailSheet.tsx` that opens when a partner card is clicked:

```
+---------------------------------------+
|  [Avatar] Partner Name          [X]   |
|  "Money handled by this partner"      |
+---------------------------------------+
|                                       |
|  SUMMARY FOR: FY 2025-26              |
|  +-------------+ +-------------+      |
|  | Cash        | | Online      |      |
|  | Opening: ₹X | | Opening: ₹X |      |
|  | + Income: ₹X| | + Income: ₹X|      |
|  | - Expense:₹X| | - Expense:₹X|      |
|  | Closing: ₹X | | Closing: ₹X |      |
|  +-------------+ +-------------+      |
|                                       |
|  INCOME ENTRIES (5)                   |
|  [TransactionItem] (editable)         |
|  [TransactionItem] (editable)         |
|                                       |
|  EXPENSE ENTRIES (12)                 |
|  [TransactionItem] (editable)         |
|  [TransactionItem] (editable)         |
+---------------------------------------+
```

**Features:**
- Shows all transactions handled by this partner within the selected date range
- Uses the same `TransactionItem` component for consistency (swipe to delete, expand to edit)
- Grouped by Income and Expense for clarity
- Shows the balance breakdown at the top

### 2. Simplify Partner Cards in the List

Make each partner card clickable and less cluttered:

**Current Card (Too Dense):**
```
+-------------------------------------------+
| [Avatar] Partner Name      [Edit] [Delete]|
| +------------------+ +------------------+ |
| | Cash             | | Online           | |
| | 5 txns           | | 3 txns           | |
| | ₹15,000          | | ₹8,000           | |
| | Closing Balance  | | Closing Balance  | |
| | Opening: ₹X      | | Opening: ₹X      | |
| | + Income: ₹X     | | + Income: ₹X     | |
| | - Expense: ₹X    | | - Expense: ₹X    | |
| +------------------+ +------------------+ |
+-------------------------------------------+
```

**New Card (Cleaner, Clickable):**
```
+-------------------------------------------+
| [Avatar] Partner Name        [Edit][Del]> |
|                                           |
| Cash: ₹15,000 (5 txns)  Online: ₹8,000   |
| Total: ₹23,000          (3 txns)          |
|                                           |
| Tap to view transactions                  |
+-------------------------------------------+
```

- Simpler summary view
- Chevron indicates it's tappable
- "Tap to view transactions" hint
- Full breakdown moves to the detail sheet

### 3. Add Explanatory Header

Add a clearer explanation of what Partners track:

```
+-------------------------------------------+
| Partners                                  |
|                                           |
| Track which partner is holding the money. |
| Each partner's balance shows:             |
| • Opening balance (start of period)       |
| • Income they received                    |
| • Expenses they made                      |
| • Closing balance (current holdings)      |
+-------------------------------------------+
```

---

## Technical Implementation

### File Changes

| File | Changes |
|------|---------|
| `src/components/settings/PartnerDetailSheet.tsx` | **NEW** - Detail sheet component showing partner transactions |
| `src/components/settings/PartnersSection.tsx` | Simplify cards, add click handler to open detail sheet, add explanatory header |
| `src/lib/store.ts` | Add `getTransactionsByPartnerId(partnerId, startDate?, endDate?)` helper |

### New Store Function

```typescript
getTransactionsByPartnerId: (partnerId: string, startDate?: string, endDate?: string) => {
  let txns = get().transactions.filter(t => t.partnerId === partnerId);
  if (startDate && endDate) {
    txns = txns.filter(t => t.date >= startDate && t.date <= endDate);
  }
  return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
```

### Partner Detail Sheet Structure

```tsx
// PartnerDetailSheet.tsx
interface PartnerDetailSheetProps {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
  dateRange: { start: string; end: string };
  balanceData: PartnerPeriodBalance;
  userId?: string;
}

export const PartnerDetailSheet = ({...}) => {
  const { transactions, getCategoryById } = useFinanceStore();
  
  // Filter transactions for this partner and date range
  const partnerTransactions = transactions.filter(t => 
    t.partnerId === partner.id && 
    t.date >= dateRange.start && 
    t.date <= dateRange.end
  );
  
  const incomeTransactions = partnerTransactions.filter(t => t.type === 'income');
  const expenseTransactions = partnerTransactions.filter(t => t.type === 'expense');
  
  return (
    <Drawer>
      {/* Partner header with avatar */}
      {/* Balance summary cards */}
      {/* Income transactions list with TransactionItem */}
      {/* Expense transactions list with TransactionItem */}
    </Drawer>
  );
};
```

### Simplified Partner Card

```tsx
// Inside PartnersSection.tsx
<motion.div
  key={partner.id}
  onClick={() => openPartnerDetail(partner.id)}
  className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:border-primary/50 transition-colors"
>
  <div className="flex items-center justify-between">
    {/* Avatar and name */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full" style={{backgroundColor: partner.color}}>
        {partner.name.charAt(0)}
      </div>
      <span className="font-semibold">{partner.name}</span>
    </div>
    
    {/* Edit/Delete buttons + Chevron */}
    <div className="flex items-center gap-2">
      <button onClick={(e) => { e.stopPropagation(); handleEdit(partner.id); }}>
        <Edit2 />
      </button>
      <button onClick={(e) => { e.stopPropagation(); handleDelete(partner.id); }}>
        <Trash2 />
      </button>
      <ChevronRight className="text-muted-foreground" />
    </div>
  </div>
  
  {/* Simplified balance summary */}
  <div className="mt-3 flex items-center gap-4 text-sm">
    <div className="flex items-center gap-1">
      <Banknote size={14} className="text-muted-foreground" />
      <span className="font-medium">₹{closingCash.toLocaleString()}</span>
      <span className="text-muted-foreground">({cashTxnCount})</span>
    </div>
    <div className="flex items-center gap-1">
      <CreditCard size={14} className="text-muted-foreground" />
      <span className="font-medium">₹{closingOnline.toLocaleString()}</span>
      <span className="text-muted-foreground">({onlineTxnCount})</span>
    </div>
  </div>
  
  <p className="text-xs text-muted-foreground mt-2">Tap to view transactions</p>
</motion.div>
```

---

## UX Flow

1. User opens **Settings > Partners**
2. Sees explanatory header explaining the feature
3. Selects time filter (FY, Week, Month, Custom)
4. Sees list of partners with simplified balance summaries
5. **Taps on a partner card**
6. **Detail sheet slides up** showing:
   - Full balance breakdown (opening/income/expense/closing)
   - All income transactions with full `TransactionItem` functionality
   - All expense transactions with full `TransactionItem` functionality
7. Can edit/delete any transaction directly from the detail sheet
8. Closing the sheet returns to the partner list

---

## Summary

| Before | After |
|--------|-------|
| No way to see partner transactions | Full transaction list in detail sheet |
| Dense, confusing cards | Clean summary cards with tap hint |
| No explanation of feature | Clear header explaining the purpose |
| Information overload | Layered disclosure (summary -> detail) |
| Can only see numbers | Can see and edit actual transactions |


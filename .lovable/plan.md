
# Partner Features Enhancement

## Overview

This plan adds three key enhancements to the partner balance tracking system:

1. **Show partner on all transactions** - Display partner name/badge in transaction list items and expanded details
2. **Partner selector in EditTransactionSheet** - Add the missing partner dropdown (already exists in AddTransactionSheet)
3. **Partner-to-Partner Transfers** - New feature to transfer money between partners with a single action

---

## Current State Analysis

After reviewing the codebase:
- `AddTransactionSheet.tsx` already has the partner selector (lines 600-670)
- `EditTransactionSheet.tsx` is missing the partner selector entirely (no `partnerId` state or dropdown)
- `TransactionItem.tsx` doesn't display partner info in the list or expanded view
- `UpcomingRecurringCard.tsx` could show partner info but currently doesn't
- No transfer functionality exists between partners

---

## Implementation Details

### 1. Update EditTransactionSheet.tsx

Add partner selector functionality:
- Import `Users` icon from lucide-react
- Add `partnerId` state initialized from `transaction.partnerId`
- Add `showPartners` state for the dropdown
- Add `selectedPartner` lookup from partners array
- Add partner field to `handleSubmit` update call
- Add partner reset in useEffect when transaction changes
- Add partner dropdown UI (same pattern as AddTransactionSheet)

**Key changes:**
```typescript
// New state
const [partnerId, setPartnerId] = useState(transaction.partnerId || "");
const [showPartners, setShowPartners] = useState(false);

// In useEffect reset
setPartnerId(transaction.partnerId || "");

// In handleSubmit
partnerId: partnerId || undefined,
```

### 2. Update TransactionItem.tsx

Show partner indicator in both collapsed and expanded views:
- Import `partners` from useFinanceStore
- Look up partner by `transaction.partnerId`
- Add small colored badge next to payment method in subtitle
- Add partner row in expanded details section

**Display pattern:**
- Collapsed view: Add partner initial badge after time
- Expanded view: Add "Handled by: Partner Name" row with colored indicator

### 3. Update UpcomingRecurringCard.tsx

Show partner on upcoming recurring transactions:
- Import partners from store
- Look up partner for each upcoming item
- Display small partner badge if assigned

### 4. Add Partner Transfer Feature

Create new component `PartnerTransferSheet.tsx`:
- Modal/sheet for creating transfers between partners
- Fields: From Partner, To Partner, Amount, Payment Method, Date, Notes
- Creates TWO transactions atomically:
  - Expense from source partner
  - Income to destination partner
- Both use same amount, date, and linked via notes or a special category

**UI Flow:**
- Access from PartnerBalanceCard "Transfer" button
- Select source partner (who is giving money)
- Select destination partner (who is receiving)
- Enter amount
- Select payment method (cash/online)
- Submit creates both transactions

### 5. Update PartnerBalanceCard.tsx

Add transfer action button:
- Add "Transfer" button that opens PartnerTransferSheet
- Only show when 2+ partners exist

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/EditTransactionSheet.tsx` | Add partner selector state, dropdown UI, and submit logic |
| `src/components/TransactionItem.tsx` | Display partner badge in list and expanded view |
| `src/components/UpcomingRecurringCard.tsx` | Show partner indicator on upcoming items |
| `src/components/PartnerBalanceCard.tsx` | Add Transfer button |
| `src/components/PartnerTransferSheet.tsx` | **NEW** - Transfer form component |

---

## Technical Details

### Partner Selector Pattern (for EditTransactionSheet)

```text
+----------------------------------+
| Handled By (optional)            |
+----------------------------------+
| [Partner avatar] Partner Name  v |
+----------------------------------+
```

Dropdown options:
- "None" option (clears selection)
- List of partners with color indicators

### Transaction Item Partner Display

**Collapsed row subtitle:**
```text
Vendor Name • Category • 10:30 AM • [S]
                                     ^-- Partner initial badge
```

**Expanded details:**
```text
Date:     Jan 26, 2026
Payment:  💳 Online
Partner:  [S] Sanjay    <-- New row
Project:  Event Name
Notes:    Payment details
```

### Transfer Sheet Fields

```text
┌──────────────────────────────────┐
│  Transfer Between Partners       │
├──────────────────────────────────┤
│  From Partner:  [Dropdown]       │
│  To Partner:    [Dropdown]       │
│  Amount:        ₹ ________       │
│  Payment:       [Cash] [Online]  │
│  Date:          [Date picker]    │
│  Notes:         [Optional]       │
│                                  │
│  [Cancel]        [Transfer]      │
└──────────────────────────────────┘
```

### Transfer Transaction Creation

When transferring 10,000 from Partner A to Partner B:

**Transaction 1 (Expense):**
- type: 'expense'
- amount: 10000
- partnerId: Partner A's ID
- title: "Transfer to Partner B"
- category: "Partner Transfer" (or misc expense)
- paymentMethod: selected method

**Transaction 2 (Income):**
- type: 'income'
- amount: 10000
- partnerId: Partner B's ID
- title: "Transfer from Partner A"
- category: "Partner Transfer" (or misc income)
- paymentMethod: selected method

---

## User Experience

1. **Viewing transactions**: Partner badge visible on each transaction
2. **Editing transactions**: Can assign/change partner via dropdown
3. **Adding transactions**: Partner selector already works
4. **Transferring money**: Quick action from Partner Balance card
5. **Balance tracking**: Transfers correctly debit/credit respective partners




# Improved Part Payment / Installment Tracking System

## Overview

This plan redesigns the part payment feature to provide a more intuitive inline installment management experience. When a user toggles "Part Payment" on, they'll see:
1. A running list of planned or received installments directly below the toggle
2. The ability to add installments with custom amounts
3. A "Confirm Payment" action to mark each installment as received
4. Real-time updates across all related data (project totals, vendor spending, partner balances)

---

## Current State Analysis

The existing implementation:
- **Toggle ON** → Shows single "Total Expected Amount" input
- **Saves** → Creates one transaction with `isPartPayment=true` and `totalExpectedAmount`
- **Tracking** → Uses `PartPaymentTracker.tsx` as a separate component to show progress
- **Linked payments** → Uses `linkedTransactionId` to connect subsequent payments to the parent

**User's request**: They want to manage installments **inline** within the transaction form itself, with the ability to:
1. Add multiple installment entries with custom amounts
2. Confirm when each payment is received
3. See all data automatically update

---

## Proposed User Experience

### When Adding a New Transaction (Part Payment Mode)

```text
┌─────────────────────────────────────────┐
│ 🟠 This is a part payment     [TOGGLE]  │
├─────────────────────────────────────────┤
│                                         │
│  Total Expected Amount                  │
│  ₹ 50,000                              │
│                                         │
│  ─── Installments ───                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Installment 1         ₹ 15,000  │   │
│  │ Current payment (auto-filled)   │   │
│  │ Status: ✓ This payment          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Installment 2         ₹ _____   │   │
│  │ Expected date: [Select]         │   │
│  │ Status: ○ Pending               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [+ Add Another Installment]           │
│                                         │
│  Remaining: ₹35,000                     │
│                                         │
└─────────────────────────────────────────┘
```

### Workflow

1. **User toggles "Part Payment" ON**
2. **Enters Total Expected Amount** (e.g., ₹50,000)
3. **First installment auto-populates** with the current transaction amount
4. **User can add more planned installments** with expected amounts and dates
5. **On Save**: 
   - Main transaction saved with `isPartPayment=true`, `totalExpectedAmount=50000`
   - Planned installments stored as metadata (not separate transactions yet)
6. **Later, when payment is received**:
   - User opens the existing part payment transaction
   - Clicks "Confirm Received" on a pending installment
   - System creates a new linked transaction with that amount

---

## Technical Implementation

### 1. Database Schema Enhancement

We need to store planned installments. Two approaches:

**Option A: JSON Column** (Simpler, chosen approach)
Add a `planned_installments` JSONB column to store expected installments that haven't been received yet.

```sql
ALTER TABLE transactions 
ADD COLUMN planned_installments jsonb DEFAULT '[]'::jsonb;
```

Structure:
```json
[
  { "id": "inst-1", "amount": 15000, "expectedDate": "2026-03-15", "status": "pending" },
  { "id": "inst-2", "amount": 10000, "expectedDate": "2026-04-15", "status": "pending" }
]
```

**Option B: Separate Table** (More complex, better for querying)
Create an `installments` table - overkill for this use case.

---

### 2. Update Types (`src/lib/types.ts`)

```typescript
export interface PlannedInstallment {
  id: string;
  amount: number;
  expectedDate?: string;
  status: 'pending' | 'received';
  receivedDate?: string;
}

export interface Transaction {
  // ...existing fields...
  isPartPayment?: boolean;
  totalExpectedAmount?: number;
  linkedTransactionId?: string;
  plannedInstallments?: PlannedInstallment[]; // NEW
}
```

---

### 3. Update AddTransactionSheet (`src/components/AddTransactionSheet.tsx`)

Replace the simple "Total Expected Amount" input with a full installment manager:

**New State Variables:**
```typescript
const [plannedInstallments, setPlannedInstallments] = useState<PlannedInstallment[]>([]);
```

**New UI Section** (replaces lines 851-883):

```tsx
{isPartPayment && (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    className="mt-3 space-y-4"
  >
    {/* Total Expected Amount */}
    <div>
      <Label className="text-xs text-muted-foreground">Total Expected Amount</Label>
      <div className="flex items-center gap-2 border-b-2 border-amber-500/50 pb-2 mt-1">
        <span className="text-lg font-bold text-muted-foreground">{CURRENCY_SYMBOL}</span>
        <input
          type="number"
          inputMode="decimal"
          value={totalExpectedAmount}
          onChange={(e) => setTotalExpectedAmount(e.target.value)}
          placeholder="0"
          className="flex-1 text-xl font-bold bg-transparent outline-none"
        />
      </div>
    </div>

    {/* Installments List */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Installments
        </Label>
        <span className="text-xs text-amber-500">
          {plannedInstallments.length + 1} installment(s)
        </span>
      </div>

      {/* Current Payment (First Installment) */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
            <span className="text-sm font-medium">This Payment</span>
          </div>
          <span className="font-bold text-amber-600">
            {CURRENCY_SYMBOL}{parseFloat(amount || '0').toLocaleString('en-IN')}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-7">
          {format(date, 'MMM dd, yyyy')} • Will be recorded now
        </p>
      </div>

      {/* Planned Future Installments */}
      {plannedInstallments.map((inst, idx) => (
        <InstallmentRow
          key={inst.id}
          installment={inst}
          index={idx + 2}
          onUpdate={(updates) => updateInstallment(inst.id, updates)}
          onRemove={() => removeInstallment(inst.id)}
        />
      ))}

      {/* Add Installment Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addNewInstallment}
        className="w-full border-dashed border-amber-500/30 text-amber-600 hover:bg-amber-500/5"
      >
        <Plus size={14} className="mr-1" />
        Add Another Installment
      </Button>
    </div>

    {/* Summary */}
    <div className="p-3 bg-muted rounded-xl space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Total Expected:</span>
        <span className="font-medium">
          {CURRENCY_SYMBOL}{parseFloat(totalExpectedAmount || '0').toLocaleString('en-IN')}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Planned:</span>
        <span className="font-medium">
          {CURRENCY_SYMBOL}{(parseFloat(amount || '0') + plannedInstallments.reduce((sum, i) => sum + i.amount, 0)).toLocaleString('en-IN')}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Remaining:</span>
        <span className={cn(
          "font-semibold",
          getRemainingAmount() > 0 ? "text-amber-500" : "text-success"
        )}>
          {CURRENCY_SYMBOL}{getRemainingAmount().toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  </motion.div>
)}
```

**Helper Functions:**
```typescript
const addNewInstallment = () => {
  const remaining = getRemainingAmount();
  setPlannedInstallments([
    ...plannedInstallments,
    {
      id: uuidv4(),
      amount: remaining > 0 ? remaining : 0,
      expectedDate: undefined,
      status: 'pending'
    }
  ]);
};

const updateInstallment = (id: string, updates: Partial<PlannedInstallment>) => {
  setPlannedInstallments(prev => 
    prev.map(inst => inst.id === id ? { ...inst, ...updates } : inst)
  );
};

const removeInstallment = (id: string) => {
  setPlannedInstallments(prev => prev.filter(inst => inst.id !== id));
};

const getRemainingAmount = () => {
  const total = parseFloat(totalExpectedAmount || '0');
  const current = parseFloat(amount || '0');
  const planned = plannedInstallments.reduce((sum, i) => sum + i.amount, 0);
  return Math.max(0, total - current - planned);
};
```

---

### 4. Create InstallmentRow Component

**File: `src/components/InstallmentRow.tsx`**

A reusable component for each installment entry:

```tsx
interface InstallmentRowProps {
  installment: PlannedInstallment;
  index: number;
  onUpdate: (updates: Partial<PlannedInstallment>) => void;
  onRemove: () => void;
  showConfirmButton?: boolean;
  onConfirm?: () => void;
}

export const InstallmentRow = ({
  installment,
  index,
  onUpdate,
  onRemove,
  showConfirmButton,
  onConfirm
}: InstallmentRowProps) => {
  return (
    <div className="p-3 bg-muted/50 border border-border rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
            installment.status === 'received' 
              ? "bg-success text-white" 
              : "bg-muted-foreground/20 text-muted-foreground"
          )}>
            {installment.status === 'received' ? <Check size={12} /> : index}
          </div>
          <span className="text-sm font-medium">
            Installment #{index}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          <X size={14} />
        </Button>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="number"
            value={installment.amount || ''}
            onChange={(e) => onUpdate({ amount: parseFloat(e.target.value) || 0 })}
            placeholder="Amount"
            className="h-8 text-sm"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <CalendarIcon size={12} className="mr-1" />
              {installment.expectedDate 
                ? format(parseISO(installment.expectedDate), 'MMM dd') 
                : 'Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={installment.expectedDate ? parseISO(installment.expectedDate) : undefined}
              onSelect={(d) => onUpdate({ expectedDate: d ? format(d, 'yyyy-MM-dd') : undefined })}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {showConfirmButton && installment.status === 'pending' && (
        <Button
          onClick={onConfirm}
          size="sm"
          className="w-full bg-success hover:bg-success/90 text-white"
        >
          <Check size={14} className="mr-1" />
          Confirm Payment Received
        </Button>
      )}
    </div>
  );
};
```

---

### 5. Update Store (`src/lib/store.ts`)

**Modify `addTransaction`** to include `plannedInstallments`:

```typescript
const transactionData = {
  // ...existing fields...
  planned_installments: transaction.plannedInstallments 
    ? JSON.stringify(transaction.plannedInstallments) 
    : '[]',
};
```

**Add new action `confirmInstallment`**:

```typescript
confirmInstallment: async (parentTransactionId: string, installmentId: string, userId?: string) => {
  const parent = get().transactions.find(t => t.id === parentTransactionId);
  if (!parent || !parent.plannedInstallments) return;
  
  const installment = parent.plannedInstallments.find(i => i.id === installmentId);
  if (!installment || installment.status === 'received') return;
  
  // 1. Create a new linked transaction for this installment
  const newTransactionId = uuidv4();
  const linkedTransaction: Transaction = {
    id: newTransactionId,
    type: parent.type,
    amount: installment.amount,
    title: parent.title ? `${parent.title} - Installment` : undefined,
    vendor: parent.vendor,
    categoryId: parent.categoryId,
    projectId: parent.projectId,
    partnerId: parent.partnerId,
    paymentMethod: parent.paymentMethod,
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    notes: `Installment payment for ${parent.title || parent.vendor}`,
    linkedTransactionId: parentTransactionId, // Link to parent
  };
  
  // 2. Update parent's plannedInstallments to mark as received
  const updatedInstallments = parent.plannedInstallments.map(i => 
    i.id === installmentId 
      ? { ...i, status: 'received' as const, receivedDate: format(new Date(), 'yyyy-MM-dd') }
      : i
  );
  
  // 3. Optimistically update local state
  set((state) => ({
    transactions: [
      linkedTransaction,
      ...state.transactions.map(t => 
        t.id === parentTransactionId 
          ? { ...t, plannedInstallments: updatedInstallments }
          : t
      )
    ]
  }));
  
  // 4. Queue both operations for sync
  // ... sync logic for new transaction and parent update
  
  get().addNotification({
    type: 'transaction',
    title: 'Installment Confirmed',
    message: `₹${installment.amount.toLocaleString()} received for ${parent.title || parent.vendor}`,
  });
}
```

---

### 6. Update PartPaymentTracker

Enhance `src/components/PartPaymentTracker.tsx` to show pending installments with confirm buttons:

```tsx
{/* Pending Installments */}
{group.parent.plannedInstallments?.filter(i => i.status === 'pending').length > 0 && (
  <div className="space-y-2 mt-3">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      Pending Installments
    </p>
    {group.parent.plannedInstallments
      .filter(i => i.status === 'pending')
      .map((inst, idx) => (
        <div key={inst.id} className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {CURRENCY_SYMBOL}{inst.amount.toLocaleString('en-IN')}
              </p>
              {inst.expectedDate && (
                <p className="text-xs text-muted-foreground">
                  Expected: {format(parseISO(inst.expectedDate), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => confirmInstallment(group.parent.id, inst.id)}
              className="bg-success hover:bg-success/90 text-white text-xs"
            >
              <Check size={12} className="mr-1" />
              Confirm
            </Button>
          </div>
        </div>
      ))}
  </div>
)}
```

---

### 7. Database Migration

```sql
-- Add planned_installments column for storing future installment plans
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS planned_installments jsonb DEFAULT '[]'::jsonb;

-- Add index for querying part payments with pending installments
CREATE INDEX IF NOT EXISTS idx_transactions_part_payment 
ON transactions (user_id, is_part_payment) 
WHERE is_part_payment = true;
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/types.ts` | MODIFY | Add `PlannedInstallment` interface and update `Transaction` type |
| `src/components/AddTransactionSheet.tsx` | MODIFY | Replace simple input with full installment manager UI |
| `src/components/InstallmentRow.tsx` | CREATE | Reusable component for individual installment entries |
| `src/lib/store.ts` | MODIFY | Add `confirmInstallment` action, update `addTransaction`/`updateTransaction` |
| `src/components/PartPaymentTracker.tsx` | MODIFY | Show pending installments with confirm buttons |
| `src/hooks/useCloudSync.ts` | MODIFY | Handle `plannedInstallments` field mapping |
| Database Migration | CREATE | Add `planned_installments` JSONB column |

---

## User Flow Summary

### Creating a Part Payment

1. Add new expense/income
2. Toggle "Mark as part payment" ON
3. Enter total expected amount (e.g., ₹50,000)
4. Current amount (e.g., ₹15,000) auto-appears as "This Payment"
5. Click "+ Add Another Installment" to plan future payments
6. Enter amounts and expected dates for each
7. Save - transaction created with installment plan attached

### Confirming a Payment

1. Open PartPaymentTracker (from Dashboard or transaction detail)
2. See pending installments with expected dates
3. When payment arrives, click "Confirm Payment Received"
4. New linked transaction created automatically
5. Progress bar updates, project/vendor totals update
6. Notification confirms the action


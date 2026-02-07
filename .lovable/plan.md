
# Enhanced Reports Export and Installment Tracking

## Overview

This plan addresses four key requirements:
1. **CSV Export Enhancement**: Include all relevant details (project name, vendor name, date, amount, notes, partner, etc.)
2. **PDF Export Implementation**: Create professional PDF export with same details
3. **Professional File Formatting**: Better file naming and header rows with client name, FinTrack Plus branding, and report duration
4. **Installment/Part Payment Tracking**: Add ability to mark transactions as partial payments and track remaining amounts

---

## Technical Analysis

### Current State
- **CSV Export** (`ReportsSection.tsx` lines 58-93): Currently exports Date, Time, Type, Vendor, Category, Amount, Payment Method, Notes - missing Project, Partner, Title, GST status
- **PDF Export** (line 205-207): Shows "Coming soon" toast - not implemented
- **File Naming**: Uses `fintrackplus-{startDate}-{endDate}.csv` format
- **User Profile**: Stored in `userProfile.name` - can be used as "Client Name"
- **Transaction Schema**: Has fields for type, amount, vendor, category_id, project_id, partner_id, payment_method, date, time, notes, is_gst, title, receipt_url

### Missing for Installments
The current Transaction interface has no installment-related fields. We need to add:
- `isPartPayment`: Boolean flag for partial payment
- `totalAmount`: Full amount expected
- `remainingAmount`: Amount left to pay/receive
- `linkedTransactionId`: Link to parent transaction for installment grouping

---

## Implementation Plan

### Part 1: Enhanced CSV Export

**File: `src/components/settings/ReportsSection.tsx`**

1. Update CSV headers to include all fields:
```typescript
const headers = [
  'Date', 'Time', 'Title', 'Type', 'Vendor', 'Category', 'Project', 
  'Partner', 'Amount', 'Payment Method', 'GST', 'Notes'
];
```

2. Update row generation to include project and partner names:
```typescript
const rows = filteredTransactions.map(t => {
  const category = categories.find(c => c.id === t.categoryId);
  const project = projects.find(p => p.id === t.projectId);
  const partner = partners.find(p => p.id === t.partnerId);
  return [
    t.date, t.time, t.title || '',
    t.type === 'income' ? 'Income' : 'Expense',
    t.vendor, category?.name || 'Other',
    project?.name || '', partner?.name || '',
    t.amount.toString(), t.paymentMethod === 'cash' ? 'Cash' : 'Online',
    t.isGst ? 'Yes' : 'No', t.notes || ''
  ];
});
```

3. Add professional header rows with client info:
```typescript
const reportHeader = [
  ['FinTrack Plus - Financial Report'],
  [''],
  ['Client Name:', userProfile.name],
  ['Report Period:', `${format(dateRange.start, 'MMM dd, yyyy')} to ${format(dateRange.end, 'MMM dd, yyyy')}`],
  ['Generated On:', format(new Date(), 'MMM dd, yyyy HH:mm')],
  ['Total Transactions:', stats.count.toString()],
  [''],
  ['Summary'],
  ['Total Income:', formatCurrency(stats.income)],
  ['Total Expense:', formatCurrency(stats.expense)],
  ['Net Balance:', formatCurrency(stats.balance)],
  [''],
];
```

4. Update file naming:
```typescript
const fileName = `${userProfile.name.replace(/[^a-zA-Z0-9]/g, '_')} - ${format(dateRange.start, 'MMM yyyy')} to ${format(dateRange.end, 'MMM yyyy')} - Report - FinTrack Plus.csv`;
```

---

### Part 2: PDF Export Implementation

**File: `src/components/settings/ReportsSection.tsx`**

Implement PDF generation using native browser print functionality with styled HTML:

```typescript
const handleExportPDF = () => {
  if (filteredTransactions.length === 0) {
    toast.error("No transactions to export");
    return;
  }

  // Create styled HTML document
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${userProfile.name} - Report - FinTrack Plus</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #6366f1; margin: 0; }
        .meta { background: #f4f4f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
        .stat-box { flex: 1; padding: 15px; border-radius: 8px; text-align: center; }
        .income { background: #dcfce7; }
        .expense { background: #fee2e2; }
        .balance { background: #e0e7ff; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #6366f1; color: white; padding: 10px; text-align: left; }
        td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 11px; }
      </style>
    </head>
    <body>
      <!-- Header, Summary, Table with all transaction details -->
    </body>
    </html>
  `;
  
  // Open print dialog
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
};
```

---

### Part 3: Installment/Part Payment Tracking

This requires database schema changes and UI updates.

**Step 1: Database Migration**

Add new columns to the transactions table:
```sql
ALTER TABLE transactions 
ADD COLUMN is_part_payment boolean DEFAULT false,
ADD COLUMN total_expected_amount numeric,
ADD COLUMN linked_transaction_id uuid REFERENCES transactions(id);
```

**Step 2: Update Types**

**File: `src/lib/types.ts`**

Add to Transaction interface:
```typescript
export interface Transaction {
  // ...existing fields...
  isPartPayment?: boolean;
  totalExpectedAmount?: number;
  linkedTransactionId?: string;
}
```

**Step 3: Update AddTransactionSheet**

**File: `src/components/AddTransactionSheet.tsx`**

Add Part Payment toggle section:
```typescript
// State
const [isPartPayment, setIsPartPayment] = useState(false);
const [totalExpectedAmount, setTotalExpectedAmount] = useState("");

// UI - Add after Amount section
{/* Part Payment Toggle */}
<div>
  <button
    onClick={() => setIsPartPayment(!isPartPayment)}
    className={cn(
      "w-full p-3 rounded-xl flex items-center justify-between border-2 transition-colors",
      isPartPayment ? "border-amber-500 bg-amber-500/5" : "border-transparent bg-muted"
    )}
  >
    <div className="flex items-center gap-2">
      <SplitSquareHorizontal size={16} className={isPartPayment ? "text-amber-500" : "text-muted-foreground"} />
      <span className="text-sm font-medium">
        {isPartPayment ? "This is a part payment" : "Mark as part payment"}
      </span>
    </div>
    {/* Toggle switch */}
  </button>
  
  {isPartPayment && (
    <div className="mt-2">
      <Label>Total Expected Amount</Label>
      <Input
        type="number"
        value={totalExpectedAmount}
        onChange={(e) => setTotalExpectedAmount(e.target.value)}
        placeholder="Enter full amount"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Remaining: ₹{(parseFloat(totalExpectedAmount || '0') - parseFloat(amount || '0')).toLocaleString()}
      </p>
    </div>
  )}
</div>
```

**Step 4: Installment Tracking View**

Create a section to view all part payments with their progress:

**File: `src/components/PartPaymentTracker.tsx`** (New Component)

Shows:
- Transactions marked as part payments
- Progress bar showing paid vs remaining
- Button to log the next installment (pre-fills amount, vendor, category, project from parent)
- Visual grouping of linked payments

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/settings/ReportsSection.tsx` | MODIFY | Enhanced CSV with all fields, professional headers, PDF export |
| `src/lib/types.ts` | MODIFY | Add installment-related fields to Transaction interface |
| `src/components/AddTransactionSheet.tsx` | MODIFY | Add part payment toggle and total expected amount |
| `src/lib/store.ts` | MODIFY | Handle new installment fields in addTransaction/updateTransaction |
| `src/components/PartPaymentTracker.tsx` | CREATE | New component to view and manage installment payments |
| Database Migration | CREATE | Add is_part_payment, total_expected_amount, linked_transaction_id columns |

---

## File Naming Convention

The export file names will follow this pattern:
- **CSV**: `{Client Name} - {Month Year} to {Month Year} - Report - FinTrack Plus.csv`
- **PDF**: `{Client Name} - {Month Year} to {Month Year} - Report - FinTrack Plus.pdf`
- **CA Package**: `{Client Name} - CA Export - {Date Range}.zip`

Example: `Acme Corp - Jan 2026 to Feb 2026 - Report - FinTrack Plus.csv`

---

## CSV File Structure Preview

```text
FinTrack Plus - Financial Report
,
Client Name:,Acme Corp
Report Period:,Jan 01, 2026 to Feb 07, 2026
Generated On:,Feb 07, 2026 14:30
Total Transactions:,125
,
Summary
Total Income:,₹5,50,000
Total Expense:,₹3,20,000
Net Balance:,₹2,30,000
,
Date,Time,Title,Type,Vendor,Category,Project,Partner,Amount,Payment Method,GST,Notes
2026-02-07,14:30,Office Supplies,Expense,Amazon,Shopping,Website Redesign,John,2500,Online,No,Monthly supplies
...
```

---

## User Experience

### Enhanced Reports
- Open Reports section in Settings
- Select time frame (Week/Month/Year/Custom)
- Click "Export as CSV" - downloads professionally formatted CSV with header info
- Click "Export as PDF" - opens print dialog with styled report

### Part Payment Workflow
1. When adding an expense/income, toggle "Mark as part payment"
2. Enter the total expected amount (e.g., ₹50,000 for a project)
3. Enter current payment amount (e.g., ₹20,000)
4. System shows remaining (₹30,000)
5. Transaction is saved with part payment flag
6. Later, from the Part Payments section, user can see all pending installments
7. Click "Add Next Payment" to quickly log the next installment with pre-filled details

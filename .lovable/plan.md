
# Fix Project Cards Data Display & Mobile Receipt Upload

## Issues Found

### Issue 1: Project Cards Show Wrong Data
The project cards in the Projects tab display incorrect calculations that don't match the data shown in project details.

**Root Cause:**
In `ProjectOverviewPage.tsx`, the cards show:
- Budget, Spent, Expected Margin, and "Actual Margin"
- But "Actual Margin" is calculated as `Budget - Spent` which is **meaningless** for projects that have income

The `ProjectDetailSheet.tsx` correctly shows Income vs Expenses and Net, but the cards don't display income at all.

**Example from database:**
- Project "Nikunj Kanika": Income = ₹930,000, Expenses = ₹27,500
- Card shows: Budget ₹1,100,000, Spent ₹27,500, Actual ₹1,072,500 (budget - spent)
- Should show: Income ₹930,000, Expenses ₹27,500, Net +₹902,500 (income - expenses)

### Issue 2: Mobile Camera Opens Without Choice
When tapping "Attach Receipt" on mobile, the camera opens immediately without giving the option to choose from photo library.

**Root Cause:**
The `capture="environment"` attribute on the file input forces camera-only mode on mobile browsers.

---

## Solution

### Fix 1: Update Project Card Stats Grid

Change the 2x2 stats grid from:

```text
BEFORE                    AFTER
┌─────────┬──────────┐   ┌─────────┬──────────┐
│ Budget  │ Spent    │   │ Income  │ Expenses │
├─────────┼──────────┤   ├─────────┼──────────┤
│Exp.Margin│ Actual  │   │ Budget  │ Net      │
└─────────┴──────────┘   └─────────┴──────────┘
```

**New calculations:**
- **Income**: Total income from `getProjectIncome(project.id)`
- **Expenses**: Total expenses from `getProjectSpending(project.id)`
- **Budget**: Project's budget limit
- **Net**: Income - Expenses (color-coded green/red)

This matches what's shown in the project details sheet.

### Fix 2: Remove Camera-Only Restriction

Remove the `capture="environment"` attribute from the receipt upload input. This allows mobile browsers to show their native file picker which includes both:
- Take Photo (Camera)
- Photo Library
- Browse Files

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ProjectOverviewPage.tsx` | Update stats grid to show Income/Expenses/Budget/Net instead of Budget/Spent/Margin/Actual |
| `src/components/ReceiptUpload.tsx` | Remove `capture="environment"` attribute to enable photo library choice |

---

## Technical Details

### ProjectOverviewPage.tsx Changes

**Lines to update (approximately 167-282):**

1. Add income calculation for each project card:
```typescript
const income = getProjectIncome(project.id);
const net = income - spent;
```

2. Update the stats grid (lines 250-282) to show:
```tsx
<div className="grid grid-cols-2 gap-2">
  {/* Income */}
  <div className="bg-green-500/10 rounded-lg p-2">
    <p className="text-[9px] text-muted-foreground uppercase">Income</p>
    <p className="text-xs font-semibold text-green-600">₹{income.toLocaleString()}</p>
  </div>
  {/* Expenses */}
  <div className="bg-red-500/10 rounded-lg p-2">
    <p className="text-[9px] text-muted-foreground uppercase">Expenses</p>
    <p className="text-xs font-semibold text-red-600">₹{spent.toLocaleString()}</p>
  </div>
  {/* Budget */}
  <div className="bg-muted/50 rounded-lg p-2">
    <p className="text-[9px] text-muted-foreground uppercase">Budget</p>
    <p className="text-xs font-semibold">₹{project.budgetLimit.toLocaleString()}</p>
  </div>
  {/* Net */}
  <div className={cn("rounded-lg p-2", net >= 0 ? "bg-green-500/10" : "bg-red-500/10")}>
    <p className="text-[9px] text-muted-foreground uppercase">Net</p>
    <p className={cn("text-xs font-semibold", net >= 0 ? "text-green-600" : "text-red-600")}>
      {net >= 0 ? '+' : ''}₹{net.toLocaleString()}
    </p>
  </div>
</div>
```

3. Update health status calculation to use Net instead of budget-based margin

### ReceiptUpload.tsx Changes

**Line 140:** Remove the `capture` attribute:

```tsx
// Before
<input
  type="file"
  accept="image/*"
  capture="environment"  // Remove this
  ...
/>

// After
<input
  type="file"
  accept="image/*"
  ...
/>
```

---

## Receipt Sync Confirmation

Receipts ARE correctly synced to cloud and associated with projects:
- Receipts upload to: `receipts/{userId}/{transactionId}.jpg`
- URL saved in: `transactions.receipt_url`
- Transactions link to projects via: `transactions.project_id`

The database shows receipts are being saved (example: transaction `d25e5208...` has receipt URL). This is working correctly.

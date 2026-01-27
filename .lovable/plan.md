
# Receipt Uploads & CA Export Package

## Overview

Transform the app into a business-ready bookkeeping tool by adding:
1. **Receipt/Invoice uploads** - Attach photos to transactions
2. **GST toggle** - Simple on/off for GST-applicable transactions  
3. **CA Export Package** - Download ZIP with transactions CSV + all attached receipts

---

## Current State vs Target State

```text
CURRENT                           TARGET
┌──────────────────────┐         ┌──────────────────────────────────┐
│ Add Transaction      │         │ Add Transaction                  │
│ - Amount             │         │ - Amount                         │
│ - Vendor             │         │ - Vendor                         │
│ - Category           │         │ - Category                       │
│ - Date               │         │ - Date                           │
│ - Notes              │         │ - Notes                          │
└──────────────────────┘         │ + 📎 Attach Receipt (new)        │
                                 │ + 🧾 GST Transaction? (toggle)   │
                                 └──────────────────────────────────┘

EXPORT (Current)                  EXPORT (Target)
┌──────────────────────┐         ┌──────────────────────────────────┐
│ Reports Section      │         │ Reports Section                  │
│ - CSV Export         │         │ - CSV Export                     │
│ - PDF (coming soon)  │         │ - 📦 CA Export Package (new)     │
└──────────────────────┘         │   → ZIP with CSV + receipts      │
                                 │   → GST summary included         │
                                 └──────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Database Schema Updates

Add new columns and storage bucket for receipts:

**Transactions table changes:**
- `receipt_url` (text, nullable) - URL to uploaded receipt image
- `is_gst` (boolean, default false) - Whether this is a GST transaction

**New storage bucket:**
- Create `receipts` bucket (private, user-scoped)
- RLS policies for user-only access

```sql
-- Add columns to transactions
ALTER TABLE transactions ADD COLUMN receipt_url TEXT;
ALTER TABLE transactions ADD COLUMN is_gst BOOLEAN DEFAULT false;

-- Create receipts storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false);

-- Storage RLS: users can only access their own receipts
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### Step 2: Update TypeScript Types

Extend the Transaction interface:

```typescript
// src/lib/types.ts
export interface Transaction {
  // ... existing fields
  receiptUrl?: string;    // URL to receipt image in storage
  isGst?: boolean;        // Is this a GST transaction?
}
```

### Step 3: Create Receipt Upload Component

New component: `src/components/ReceiptUpload.tsx`

**Features:**
- Camera/gallery picker button
- Image preview with thumbnail
- Upload progress indicator
- Delete/replace option
- Compress images before upload (reduce file size)

**Design:**
```text
┌─────────────────────────────────────┐
│ 📎 Attach Receipt                   │
│ ┌─────────────────────────────────┐ │
│ │  [+] Tap to add photo           │ │  ← Empty state
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🖼️ receipt.jpg  ✕ Remove       │ │  ← After upload
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Step 4: Add GST Toggle Component  

New component: `src/components/GstToggle.tsx`

Simple switch with label:

```text
┌─────────────────────────────────────┐
│ 🧾 GST Transaction?                 │
│                         [  OFF  ]   │  ← Toggle switch
└─────────────────────────────────────┘
```

When ON, the transaction gets tagged with `is_gst: true` which:
- Shows a "GST" badge on transaction items
- Gets included in GST summary during export

### Step 5: Update Add/Edit Transaction Forms

**AddTransactionSheet.tsx changes:**
- Add `receiptUrl` and `isGst` state
- Insert `<ReceiptUpload />` component after Notes field
- Insert `<GstToggle />` component after Receipt upload
- Pass new fields to `addTransaction()`

**EditTransactionSheet.tsx changes:**
- Same additions as AddTransactionSheet
- Pre-populate with existing receipt/GST values

### Step 6: Update Store & Cloud Sync

**src/lib/store.ts changes:**
- Update `addTransaction` to include `receiptUrl` and `isGst`
- Update `updateTransaction` to handle receipt changes
- Handle receipt deletion when transaction is deleted

**src/hooks/useCloudSync.ts changes:**
- Map `receipt_url` ↔ `receiptUrl` 
- Map `is_gst` ↔ `isGst`

### Step 7: Show GST Badge on Transactions

**TransactionItem.tsx changes:**
- Add small "GST" badge next to amount when `isGst` is true
- Add receipt indicator (📎) when `receiptUrl` exists

```text
┌─────────────────────────────────────┐
│ 🍔 Lunch at Restaurant              │
│ ₹450  📎 [GST]                      │  ← Receipt + GST indicators
│ Today • Cash                        │
└─────────────────────────────────────┘
```

### Step 8: Create CA Export Package Feature

**New component: `src/components/settings/CAExportSection.tsx`**

Or extend existing `ReportsSection.tsx` with new export option:

**Features:**
1. Date range selector (reuse existing)
2. "Download CA Package" button
3. Generates ZIP containing:
   - `transactions.csv` - All transaction data
   - `gst_summary.csv` - GST transactions only with totals
   - `receipts/` folder - All receipt images named by transaction

**ZIP Structure:**
```text
ca-export-2024-01-01-to-2024-01-31.zip
├── transactions.csv
├── gst_summary.csv
├── receipts/
│   ├── 2024-01-05_vendor_500.jpg
│   ├── 2024-01-10_vendor_1200.jpg
│   └── ...
└── README.txt (export date, total counts)
```

**CSV Format for CA:**
```csv
Date,Type,Vendor,Category,Amount,Payment Method,GST,Receipt,Notes
2024-01-05,expense,Restaurant,Food,450,cash,Yes,receipt_001.jpg,Lunch meeting
2024-01-10,income,Client ABC,Services,50000,online,Yes,invoice_001.jpg,January invoice
```

**GST Summary CSV:**
```csv
Period,GST Expenses,GST Income,Net GST Amount
2024-01-01 to 2024-01-31,15000,50000,35000
```

### Step 9: Add JSZip Dependency

Install `jszip` for creating ZIP files in browser:
- Already commonly used, lightweight
- Works entirely client-side

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/ReceiptUpload.tsx` | **Create** | Receipt photo picker + upload |
| `src/components/GstToggle.tsx` | **Create** | Simple GST on/off toggle |
| `src/lib/types.ts` | Modify | Add `receiptUrl` and `isGst` fields |
| `src/components/AddTransactionSheet.tsx` | Modify | Add receipt upload + GST toggle |
| `src/components/EditTransactionSheet.tsx` | Modify | Add receipt upload + GST toggle |
| `src/components/TransactionItem.tsx` | Modify | Show GST badge + receipt indicator |
| `src/lib/store.ts` | Modify | Handle new fields in CRUD |
| `src/hooks/useCloudSync.ts` | Modify | Map new DB columns |
| `src/components/settings/ReportsSection.tsx` | Modify | Add CA Export Package option |

**Database:**
- Add `receipt_url` and `is_gst` columns to transactions table
- Create `receipts` storage bucket with RLS

---

## Technical Considerations

1. **Image Compression**: Compress receipt images before upload to save storage/bandwidth (target ~500KB max)

2. **Receipt Storage Path**: `receipts/{user_id}/{transaction_id}.{ext}` for clean organization

3. **ZIP Generation**: Use JSZip library to create ZIP in browser, then trigger download

4. **Large Exports**: For exports with many receipts, show progress indicator

5. **Receipt Preview**: Allow tapping receipt thumbnail to view full-size image

---

## User Flow

**Adding a receipt:**
1. User taps "Attach Receipt"  
2. Camera/gallery picker opens
3. Select/take photo
4. Image is compressed and uploaded
5. Thumbnail preview shown
6. Save transaction → receipt URL stored

**Exporting for CA:**
1. Go to Settings → Reports
2. Select date range
3. Tap "Download CA Package"
4. Progress shows while fetching receipts
5. ZIP downloads with all data + receipts
6. Share ZIP with CA via email/WhatsApp


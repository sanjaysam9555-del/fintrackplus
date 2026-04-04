

## Fix Future Document Uploads — Store Storage Path Instead of URL

### Problem
Both upload flows (project documents and receipts) currently store a full signed/public URL in the database. These URLs expire or get blocked, making documents inaccessible later. The `AllDocumentsSection` then has to reverse-engineer the storage path from the URL, which is fragile.

### Solution
Store the **raw storage path** (e.g. `userId/projectId/timestamp_file.jpg`) in the `file_url` / `receipt_url` column instead of the full URL. Then always generate fresh signed URLs on demand when viewing.

### Changes

#### 1. `src/hooks/useProjectDocuments.ts`
- Stop generating a signed/public URL after upload
- Store the raw `filePath` string (e.g. `userId/projectId/1234_doc.pdf`) as `file_url` in the database
- This makes path extraction trivial in AllDocumentsSection — the stored value IS the path

#### 2. `src/components/ReceiptUpload.tsx`
- Stop calling `getPublicUrl()` after upload
- Store the raw storage path (e.g. `userId/transactionId.jpg`) as `receipt_url` in the transaction
- For the inline preview after upload, generate a temporary signed URL or use a local object URL from the file itself (no need to hit storage again)

#### 3. `src/components/settings/AllDocumentsSection.tsx`
- Update `extractStoragePath` to detect when the stored value is already a plain path (no `http` prefix) and use it directly
- This makes new uploads work reliably while keeping backward compatibility with old URL-based records

### Files Changed
| File | Change |
|---|---|
| `src/hooks/useProjectDocuments.ts` | Store raw `filePath` instead of signed URL |
| `src/components/ReceiptUpload.tsx` | Store raw storage path, use local blob for preview |
| `src/components/settings/AllDocumentsSection.tsx` | Detect plain paths vs URLs in `extractStoragePath` |

### Technical Notes
- No database migration needed — the `file_url` and `receipt_url` columns are plain `text`; a path like `userId/projectId/file.pdf` is valid
- Old documents with full URLs continue to work via the existing URL-parsing logic
- New documents will always resolve correctly because the stored value is the exact storage path needed for `supabase.storage.download(path)`




## Fix Document Viewing — Fresh Signed URLs

### Problem
Documents fail to open because:
1. Stored signed URLs have expired or are invalid
2. Direct Supabase storage URLs are blocked by the browser
3. The `AllDocumentsSection` uses stored `file_url`/`receipt_url` values directly as `<a href>` links

### Solution
Generate fresh signed URLs on demand when a user clicks a document, instead of linking directly to stored URLs.

### Plan

#### 1. Update `AllDocumentsSection.tsx` — add on-click URL generation

- Extract the **storage path** from stored URLs (both project docs and receipts)
- Replace the `<a href>` direct link with an `onClick` handler that:
  1. Determines the bucket (`project-documents` for docs, `receipts` for receipts)
  2. Extracts the file path from the stored URL
  3. Calls `supabase.storage.from(bucket).createSignedUrl(path, 3600)` to get a fresh 1-hour signed URL
  4. Opens the signed URL in a new tab via `window.open()`
- Add a small loading indicator while the URL is being generated
- Store the original storage path alongside each document item (parse it from the URL during fetch)

#### 2. Helper: extract storage path from URL

Create a utility function that extracts the storage path from various URL formats:
- Signed URLs: parse the path between `/object/sign/<bucket>/` and `?token=`
- Public URLs: parse the path after `/object/public/<bucket>/`
- If URL doesn't match Supabase patterns (external URL), open it directly

#### 3. Update `useProjectDocuments.ts` — store file path, not just URL

When uploading, also store the raw `filePath` in the DB record so we don't need to reverse-engineer it from the URL. For existing records, we parse the path from the stored URL.

### Files Changed
| File | Change |
|---|---|
| `src/components/settings/AllDocumentsSection.tsx` | Replace `<a href>` with onClick handler that generates fresh signed URLs |
| `src/hooks/useProjectDocuments.ts` | Minor: ensure upload stores the storage path for future reference |

### Technical Notes
- No database migration needed — we parse paths from existing URLs
- Signed URLs generated on click with 1-hour expiry (short-lived, secure)
- Falls back to opening the stored URL directly if path extraction fails


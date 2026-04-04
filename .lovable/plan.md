
Implement a more reliable in-app document viewer instead of opening storage links in a new tab.

1. Fix document access in `src/components/settings/AllDocumentsSection.tsx`
- Stop relying on `window.open()` and signed URL navigation.
- Add a stronger file resolver that can handle:
  - `project-documents` signed/public/authenticated URLs
  - `receipts` URLs currently stored from upload flow
  - direct bucket-relative paths when possible
- When a user taps a document, use the storage API to fetch the file as a blob (`download`) and create a local object URL for preview. This avoids blocked backend domains and stale signed links.

2. Add an in-app preview overlay
- Reuse the existing full-screen preview pattern already used in `ProjectDetailSheet` / `ReportsSection`.
- Add preview state such as:
  - selected document
  - resolved preview URL
  - loading/error state
- Show:
  - images with `<img>`
  - PDFs with `<iframe>`
  - non-previewable files with a fallback card and actions only
- Keep the experience inside the app, full-screen on mobile.

3. Add download + share actions in the preview header
- Download button: download the fetched blob via an object URL and filename.
- Share button: use the Web Share API with a `File` when supported; otherwise fall back to download/copy message.
- This should work consistently for private files because the app is sharing/downloading the already fetched blob, not the remote storage URL.

4. Improve thumbnail loading behavior
- Keep thumbnail previews for images, but do not depend on them for opening documents.
- If thumbnail resolution fails for some files, show a file icon while still allowing open/download/share from the preview flow.

5. Optional consistency cleanup
- Update `src/hooks/useProjectDocuments.ts` and `src/components/ReceiptUpload.tsx` in a follow-up pass so future records store values in a more storage-friendly format instead of long-lived/public-style URLs from private buckets.
- This is not required for the immediate fix, but it will reduce future path-parsing edge cases.

Technical details
- Root issue: current code still depends on navigable storage URLs, and receipts appear to be stored using a public URL pattern even though `receipts` is a private bucket.
- Safer approach:
  ```text
  tap document
    -> resolve bucket + storage path
    -> storage.download(path)
    -> URL.createObjectURL(blob)
    -> preview inside app
    -> download/share from blob
  ```
- Files to update:
  - `src/components/settings/AllDocumentsSection.tsx` — main fix
  - `src/hooks/useProjectDocuments.ts` — optional normalization follow-up
  - `src/components/ReceiptUpload.tsx` — optional normalization follow-up

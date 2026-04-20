
## Root cause
The in-app preview in `AllDocumentsSection.tsx` has several issues that cause "JPGs, PNGs, PDFs, Docs not opening properly":

1. **`fileType` is unreliable** — for receipts, it's derived from URL extension (`isImageType(ext)` where `ext` is just `"jpg"`, not `"image/jpeg"`). The check `type.startsWith('image/')` then fails on the receipt's `mimeGuess` for some edge cases (e.g., `jpg` extension produces `image/jpg` which is non-standard). Worse, when `extractStoragePath` returns the raw path (new format without `http`), the `ext` is parsed from the path — fine — but if the receipt URL has query params or no extension, `fileType` becomes `application/octet-stream` and `canPreview` becomes `false`, so JPGs/PNGs show "cannot be previewed in-app".
2. **PDFs in iframes** — using a `blob:` URL in `<iframe>` works on desktop but is unreliable on mobile WebViews/Safari (some block blob iframes). PDFs also need `#toolbar=0` styling, height fixes (`h-full` on iframe in a flex container needs `min-h-0`).
3. **DOCX / unknown types** — currently fall through to the "cannot be previewed" message with only a Download button. Many users expect at least an "Open in new tab" option, and for Office docs we can use Google Docs Viewer or Microsoft Office Online viewer with the **public/signed URL** (not the blob URL).
4. **Container layout** — `flex-1 overflow-auto flex items-center justify-center p-4` centers content, but the iframe with `w-full h-full` inside flex needs the parent to have explicit constrained height. On mobile this collapses, making PDFs render with 0 height.
5. **Image error handling** — `onError` hides the thumbnail but leaves an empty grey square; we should show the icon fallback.

## Plan

### 1. Fix MIME type detection (`AllDocumentsSection.tsx`)
- For receipts, normalize: `jpg` → `image/jpeg`, `jpeg` → `image/jpeg`, `png` → `image/png`, `webp` → `image/webp`, `pdf` → `application/pdf`, `doc/docx` → `application/msword` family.
- Make `isImageType` / `isPdfType` accept both MIME and extension robustly.
- Add `isOfficeType` helper (doc, docx, xls, xlsx, ppt, pptx).

### 2. Robust preview rendering
- **Images**: `<img>` with `max-w-full max-h-full object-contain` inside a properly-sized container (`flex-1 min-h-0`).
- **PDFs**: Use `<object data={previewUrl} type="application/pdf">` with `<embed>` fallback inside, then a "Open in new tab" link. Set explicit `width="100%" height="100%"` and ensure parent container has `min-h-0` so flex-1 actually computes a height. Also append `#view=FitH&toolbar=1` to encourage native viewer toolbar.
- **Office docs**: When we have a publicly-fetchable signed URL (not blob), embed via Microsoft Office Online viewer:  
  `https://view.officeapps.live.com/op/embed.aspx?src=<encoded signed URL>`  
  Fall back to download if no signed URL is available.
- **Unknown / other**: Keep the "Download" CTA, but also add an "Open in new tab" button using the signed URL.

### 3. Container layout fix
- Change preview content wrapper to `flex-1 min-h-0 flex flex-col` so PDF/iframe children can claim full height on mobile.
- Wrap PDF/iframe in a `w-full h-full` div.

### 4. Thumbnail fallback
- On `<img onError>`, swap to the file icon (track per-item with a ref/state) instead of leaving an empty box.

### 5. Use signed URL (not blob) for iframe-based viewers
- For PDF and Office viewers, prefer the already-signed `item.fileUrl` (1-hour signed URL we created in fetch). Blob URLs work for `<img>` and download but cause problems for iframe/`<object>` on mobile and are unusable by external viewers (Office Online viewer can't fetch a `blob:`).
- Keep blob for download/share (already correct) and for `<img>` previews (works great offline-ish).

## Files touched
- `src/components/settings/AllDocumentsSection.tsx` — all of the above; single-file change.

## Out of scope
- No backend / RLS / storage policy changes.
- No new dependencies (no PDF.js install — we use native browser PDF viewer).
- No changes to upload flow or DB schema.

## Verification
1. Open All Documents → tap a JPG/PNG receipt → image renders fullscreen, fits viewport.
2. Tap a PDF → renders inline in native PDF viewer with toolbar.
3. Tap a DOCX/XLSX → renders via Office Online viewer (or graceful "Open / Download" fallback if signed URL isn't reachable).
4. On mobile, PDF doesn't collapse to zero height.
5. Broken/missing files show the friendly error state.

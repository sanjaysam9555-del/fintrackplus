

# Reports Section Fixes

## Issue 1: PDF Button Says "Coming Soon"
Line 607 shows `<p className="text-sm text-muted-foreground">Coming soon</p>` despite the PDF export being fully functional. This will be updated to show the transaction count, matching the CSV button style.

## Issue 2: Files Open in New Tab With No Navigation

Currently, `handleExportPDF` uses `window.open('', '_blank')` which opens an HTML page in a new browser tab -- users lose all app navigation and can only close the tab.

CSV and ZIP exports use the anchor-click download pattern which should trigger a download rather than opening in-app. These work correctly for downloads but on some mobile browsers/PWAs may still open inline.

**Solution**: Instead of opening exports in a new tab, create a dedicated in-app preview overlay component:

- **For PDF**: Instead of `window.open`, render the HTML report inside an iframe within a full-screen overlay that stays inside the app. The overlay will have:
  - A **back button** (arrow-left) to close the preview
  - A **download button** that triggers `window.print()` on the iframe content (for Save as PDF)
  - A clean top toolbar with the report title

- **For CSV and ZIP**: These already trigger downloads via the anchor-click method, which is correct. No changes needed for these -- they download files directly without opening them.

## Technical Details

### Changes to `ReportsSection.tsx`

1. **Line 607**: Change "Coming soon" to `{stats.count} transactions` to match CSV button.

2. **New state**: Add `pdfPreviewHtml` state to hold generated HTML content and `showPdfPreview` boolean.

3. **Modify `handleExportPDF`**: Instead of `window.open('', '_blank')`, set the HTML content into state and show the preview overlay.

4. **New Preview Overlay**: A full-screen `motion.div` overlay rendered at the end of the component with:
   - Fixed positioning covering the entire viewport
   - A sticky top bar with back button and "Download PDF" button
   - An iframe displaying the report HTML via `srcdoc` attribute
   - The download button calls `window.print()` on the iframe's contentWindow, or creates a Blob download
   - `AnimatePresence` for smooth enter/exit transitions

### Overlay Structure

```text
+----------------------------------+
| [<- Back]    Report    [Download]|
+----------------------------------+
|                                  |
|   [iframe with report HTML]      |
|                                  |
|                                  |
+----------------------------------+
```

No new dependencies required. Uses existing framer-motion for transitions and an iframe with `srcdoc` for the preview.



# Share Transaction Feature

## Overview
Add a "Share" button to transaction entries that generates a beautifully branded image card and shares it via the device's native share sheet (WhatsApp, iMessage, etc.).

## What Can Be Shared
- Individual expense or income entries, rendered as a branded card containing:
  - FinTrack+ logo and app name
  - Transaction title/vendor
  - Amount (color-coded: red for expense, green for income)
  - Category with icon
  - Date and time
  - Payment method (Cash/Online)
  - Project name (if linked)
  - Notes (if present)
  - A subtle "Tracked with FinTrack+" footer watermark

## How It Works
1. User taps **Share** on an expanded transaction item or in the transaction detail sheet
2. The app renders a hidden branded card to an off-screen canvas using the Canvas API (no extra dependencies needed)
3. The canvas is converted to a PNG blob
4. The Web Share API (`navigator.share()`) is invoked with the image -- this opens the native share sheet on mobile (WhatsApp, iMessage, Telegram, etc.)
5. On desktop or unsupported browsers, it falls back to downloading the image

## Where the Share Button Appears
- **TransactionItem** (expanded view): A third button alongside Edit and Delete
- **TransactionDetailSheet** (bottom sheet): A third button alongside Edit and Delete

## Technical Details

### New File: `src/lib/shareTransaction.ts`
A utility that:
1. Creates an off-screen `<canvas>` element (400x520px, or auto-height based on content)
2. Draws a branded card with:
   - Dark or light background matching the current theme
   - FinTrack+ logo (drawn from the app icon)
   - Transaction details in a clean layout using Canvas 2D text rendering
   - Rounded corners, color-coded amount, category label
   - Footer: "Tracked with FinTrack+" in muted text
3. Exports as PNG blob
4. Calls `navigator.share({ files: [imageFile] })` if supported, else triggers download

### Modified Files

| File | Change |
|------|--------|
| `src/lib/shareTransaction.ts` | New -- canvas rendering + Web Share API utility |
| `src/components/TransactionItem.tsx` | Add Share button in expanded actions row (between Edit and Delete) |
| `src/components/TransactionDetailSheet.tsx` | Add Share button in bottom action bar (between Edit and Delete) |

### Share Card Visual Layout

```text
+----------------------------------+
|  [Logo]  FinTrack+               |
|----------------------------------|
|                                  |
|        EXPENSE / INCOME          |
|         -Rs.12,500               |
|                                  |
|  Title     Vendor Photography    |
|  Category  Shopping              |
|  Date      15 Feb 2026, 2:30 PM |
|  Payment   Online                |
|  Project   Wedding XYZ           |
|  Notes     Advance payment...    |
|                                  |
|----------------------------------|
|    Tracked with FinTrack+        |
+----------------------------------+
```

### No New Dependencies
- Uses the native Canvas API for image generation
- Uses the Web Share API (Level 2 with file sharing) for sharing
- Both are well-supported on modern mobile browsers (iOS Safari 15+, Chrome 76+)


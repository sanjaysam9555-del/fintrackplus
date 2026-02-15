

# Improve Share Transaction Image

## Summary
Fix five issues with the shared transaction image: higher resolution, proper filename, real date instead of "Today", include all transaction fields (vendor, handled by, project), and use the actual app icon instead of a drawn circle.

## Changes

### File: `src/lib/shareTransaction.ts` (rewrite)

**1. Higher resolution**
- Increase canvas scale from 2x to 3x for sharper output on all devices.

**2. Filename format**
- Change from `fintrack-expense-2026-02-15.png` to include the transaction title: `Title - 15 Feb 2026 - FinTrack+.png`
- Example: `Domain Purchase - 15 Feb 2026 - FinTrack+.png`

**3. Exact date instead of "Today"**
- Create a local `formatShareDate` function that always outputs the full day name, date, and time (e.g., "Sat, 15 Feb 2026, 7:54 PM") instead of reusing the app's `formatDate` which returns "Today" / "Yesterday".

**4. Include all transaction fields**
- Update the `ShareData` interface to accept `vendorName`, `partnerName`, and `partnerColor` in addition to the existing fields.
- Add rows for:
  - **Vendor** (if present)
  - **Handled By** (partner name, if present)
  - **GST** badge info (if `isGst` is true)
- Update callers in `TransactionItem.tsx` and `TransactionDetailSheet.tsx` to pass the new fields.

**5. Use actual app icon**
- Load the app icon from `/app-icon-192.png` as an `Image` element and draw it (scaled to 28x28 with rounded corners) in the header instead of the hand-drawn "F+" circle.
- The image loading is async, so the function already returns a Promise -- fits naturally.

### Files Modified

| File | Change |
|------|--------|
| `src/lib/shareTransaction.ts` | All five fixes above |
| `src/components/TransactionItem.tsx` | Pass `vendorName` and `partnerName`/`partnerColor` to `shareTransaction` |
| `src/components/TransactionDetailSheet.tsx` | Pass `vendorName` and `partnerName`/`partnerColor` to `shareTransaction` |




# 7 Fixes: Partner Symmetry, PDF Layout, Summary Cards, Chart Height, Settings Button, Upload, and Avatar Propagation

## 0. Partner Avatar Position -- Fixed Location for Symmetry

**Problem**: The partner badge (avatar/monogram) sits inside a flex row between the title and the amount, so it shifts left/right depending on title length.

**Fix**: Move `<PartnerBadge />` out of the `flex items-center` right-side group and give it a fixed position. Place it immediately after the category icon (before the title) as a second flex-shrink-0 element, so it always appears in the same spot regardless of title length.

In `TransactionItem.tsx` (line ~194-196): Remove `<PartnerBadge />` from the right-side `div` and place it right after the category icon `div` (after line 155), so the layout becomes: `[CategoryIcon] [PartnerBadge] [Title...] [Amount] [Chevron]`. The badge gets `flex-shrink-0` so it never moves.

**File**: `src/components/TransactionItem.tsx`

---

## 1. PDF Export -- Laptop-Optimized Layout

**Problem**: The PDF HTML uses `font-size: 13px`, small padding, and a viewport meta tag that makes it render mobile-sized.

**Fix**: Update the PDF HTML template in `ReportsSection.tsx` to:
- Remove or widen the viewport meta tag (set `width=1200` instead of `device-width`)
- Increase body font size to 14px, table font to 12px
- Use a fixed min-width on the body (e.g., `min-width: 1100px`) so the report always renders at desktop width
- Increase table `th`/`td` padding for better readability
- This ensures the PDF looks laptop-optimized whether opened on mobile or desktop

**File**: `src/components/settings/ReportsSection.tsx` (lines ~281-367)

---

## 2. Summary Cards -- Compact 2-Row Layout

**Problem**: Summary cards have 3 visual rows: icon, label, number, making them tall.

**Fix**: Restructure `SummaryCard.tsx` to put icon and label in one row (horizontal flex), and the number below:

```text
[Icon] Income        (row 1: icon + label side by side)
35.7L                 (row 2: number)
+5.2% vs last        (row 3: optional change indicator)
```

- Reduce card padding from `p-3 lg:p-4` to `p-2.5 lg:p-3`
- Make the icon smaller (w-6 h-6 instead of w-8 h-8)
- Put icon div and label `<p>` in a `flex items-center gap-1.5` row
- Remove `mb-2` from icon, remove `mb-1` from label

**File**: `src/components/SummaryCard.tsx`

---

## 3. Cash Flow Chart -- 25% Height Reduction

**Problem**: The chart container uses `h-28` (7rem / 112px).

**Fix**: Change `h-28` to `h-20` (5rem / 80px) on the chart `div` (line 230 of `CashFlowChart.tsx`). Also reduce top margin from `mt-2` to `mt-1` and bottom legend margin from `mt-2` to `mt-1`. Reduce overall card padding from `p-4` to `p-3`. These changes cut roughly 25% of the card height while keeping the chart readable.

**File**: `src/components/CashFlowChart.tsx`

---

## 4. Settings Button on Income and Expense Tabs

**Problem**: The Settings gear icon only appears on the Home tab header.

**Fix**: In `TransactionList.tsx`, add a Settings button to the header area (line ~277-281). The component needs an `onNavigate` prop. Update:
- `TransactionListProps` interface: add `onNavigate?: (section: string) => void`
- In the header `div`, add a Settings icon button that calls `onNavigate?.('settings')`
- In `Index.tsx`, pass `onNavigate={handleNavigate}` to `TransactionList` (lines ~215, 221)

**Files**: `src/components/TransactionList.tsx`, `src/pages/Index.tsx`

---

## 5. Partner Photo Upload -- Reliability Fix

**Problem**: Upload sometimes fails or requires multiple attempts. No cropping/save confirmation.

**Fix**: In `PartnersSection.tsx`:
- Add error retry logic: wrap the upload in a try-catch with a retry (up to 2 attempts)
- Add `contentType` to the upload options so Supabase correctly handles the file
- Add a cache-busting query param to the public URL (`?t=timestamp`) to avoid stale cached images
- Reset the file input value after upload (`e.target.value = ''`) so re-selecting the same file works
- For cropping: add a simple circular preview with object-fit cover (the current implementation already does this visually; a full crop tool would require a heavy library -- instead, note that photos are displayed as circular crops automatically)

**File**: `src/components/settings/PartnersSection.tsx`

---

## 6. Partner Photo Propagation -- Updated Everywhere

**Problem**: When a partner's photo is updated in Settings, the `TransactionItem` expanded "Handled by" section (lines 255-272) reads `partner.avatarUrl` from the store. If the store's partner list is updated correctly, this should propagate. The issue is likely that `updatePartner` in the store doesn't update `avatarUrl` correctly, or the cache-busted URL isn't being used.

**Fix**:
- Ensure `updatePartner` in `store.ts` correctly merges `avatarUrl` into the partner object (verify the existing code)
- In `TransactionItem.tsx` "Handled by" section (line 259-268): it already reads from `partner.avatarUrl` -- this will work correctly once the store update and cache-busting from fix #5 are applied
- Add cache-busting to all avatar image URLs: append `?t=` + a timestamp or use the URL as-is since the URL changes on each upload (new filename with `Date.now()`)

The root cause is likely that the old cached URL is served even after update. The fix in #5 (new filename per upload + cleaning up old files) will resolve this.

**Files**: `src/components/settings/PartnersSection.tsx`, `src/components/TransactionItem.tsx`

---

## Summary of All File Changes

| File | Changes |
|------|---------|
| `src/components/TransactionItem.tsx` | Move PartnerBadge to fixed position after category icon |
| `src/components/settings/ReportsSection.tsx` | Desktop-optimized PDF HTML template (wider layout, bigger fonts) |
| `src/components/SummaryCard.tsx` | Compact 2-row layout (icon+label in row 1, number in row 2) |
| `src/components/CashFlowChart.tsx` | Reduce chart height from h-28 to h-20, tighter padding |
| `src/components/TransactionList.tsx` | Add Settings button to header, accept onNavigate prop |
| `src/pages/Index.tsx` | Pass onNavigate to TransactionList |
| `src/components/settings/PartnersSection.tsx` | Upload reliability fixes, cache-busting, file input reset |


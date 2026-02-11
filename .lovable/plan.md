

# Fix Partner Avatar Display in Two Locations

## Issue 1: Partner Badge Position in Transaction Entries

The `PartnerBadge` is currently placed between the CategoryIcon and the title text (line 158 of `TransactionItem.tsx`). While it is in a fixed flex position, the user wants it pinned further left -- directly overlapping the bottom-right of the category icon as a small overlay badge, ensuring it never shifts with content.

**Fix**: Change the layout so the CategoryIcon and PartnerBadge are wrapped together in a single `relative` container. The PartnerBadge becomes an `absolute` overlay positioned at the bottom-right corner of the category icon (like a status dot on a profile picture). This keeps it visually anchored to the left side regardless of title length.

**File**: `src/components/TransactionItem.tsx`
- Wrap the CategoryIcon div and PartnerBadge in a single `relative flex-shrink-0` container
- Position PartnerBadge with `absolute -bottom-0.5 -right-0.5` as a small 4x4 (w-4 h-4) overlay circle with a border ring
- Remove the standalone `<PartnerBadge />` from line 158
- Reduce badge size from `w-5 h-5` to `w-4 h-4` with `text-[8px]` for the monogram, add a `ring-1 ring-card` border so it stands out against the icon

## Issue 2: Partner Avatar Not Shown in Add Transaction Form

The "Handled By" partner selector in `AddTransactionSheet.tsx` only shows the colored monogram (lines 664-670 for selected state, lines 709-714 for dropdown list). It never checks for `p.avatarUrl`.

**Fix**: Update three places in `AddTransactionSheet.tsx`:
1. **Selected partner display** (lines 664-670): Check `selectedPartner.avatarUrl` -- if present, show an `<img>` instead of the monogram div
2. **Dropdown list items** (lines 709-714): Check `p.avatarUrl` -- if present, show an `<img>` instead of the monogram div
3. Apply the same fix in `EditTransactionSheet.tsx` if it has the same pattern

**Files**: `src/components/AddTransactionSheet.tsx`, `src/components/EditTransactionSheet.tsx`

---

## Technical Details

### TransactionItem.tsx -- Badge as Icon Overlay

```text
Before:  [CategoryIcon]  [PartnerBadge]  [Title...]  [Amount]
After:   [CategoryIcon]                  [Title...]  [Amount]
              [Badge]  (overlaid bottom-right of icon)
```

The PartnerBadge component will render at a smaller size (w-4 h-4) with a ring border, positioned absolutely within the icon container.

### AddTransactionSheet.tsx -- Avatar in Partner Selector

Replace the monogram-only display with a conditional check:
- If partner has `avatarUrl`: render `<img src={p.avatarUrl} className="w-6 h-6 rounded-full object-cover" />`
- Otherwise: render the existing colored monogram circle

This applies to both the selected state button and each item in the dropdown list.

| File | Change |
|------|--------|
| `src/components/TransactionItem.tsx` | Wrap CategoryIcon + PartnerBadge in relative container; badge becomes absolute overlay |
| `src/components/AddTransactionSheet.tsx` | Show partner avatar image in selected display and dropdown list items |
| `src/components/EditTransactionSheet.tsx` | Same avatar fix for edit form partner selector |

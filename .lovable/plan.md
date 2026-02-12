

# Fix Partner Avatar Display in Two Locations

## 1. Partner Badge as Icon Overlay in Transaction Entries

**Current state**: The `PartnerBadge` sits as a separate flex item between the CategoryIcon and the title (line 158). It occupies its own space in the row and shifts with content.

**Fix**: Wrap the CategoryIcon and PartnerBadge together in a single `relative flex-shrink-0` container. The badge becomes an `absolute` overlay at the bottom-right corner of the category icon -- like a status indicator on a profile picture.

- Badge size reduced from `w-5 h-5` to `w-4 h-4`, text from `text-[10px]` to `text-[8px]`
- Positioned with `absolute -bottom-0.5 -right-0.5`
- Add `ring-1 ring-card` border so it visually separates from the icon background
- Remove the standalone `<PartnerBadge />` from line 158

```
Before:  [Icon]  [Badge]  [Title...]        [Amount]
After:   [Icon]           [Title...]        [Amount]
           [Badge] (overlaid on icon corner)
```

**File**: `src/components/TransactionItem.tsx`

---

## 2. Partner Avatar in Add Transaction Form

**Current state**: The "Handled By" selector in `AddTransactionSheet.tsx` always shows a colored monogram div (lines 665-670 for selected state, lines 709-714 for dropdown items). It never checks `avatarUrl`.

**Fix**: At both locations, add a conditional: if the partner has `avatarUrl`, render `<img>` with `rounded-full object-cover`; otherwise keep the monogram.

- **Selected display** (lines 664-670): check `selectedPartner.avatarUrl`
- **Dropdown items** (lines 709-714): check `p.avatarUrl`

**File**: `src/components/AddTransactionSheet.tsx`

---

## 3. Partner Avatar in Edit Transaction Form

**Current state**: Same monogram-only pattern in `EditTransactionSheet.tsx` (lines 573-579 for selected, lines 618-623 for dropdown).

**Fix**: Identical conditional avatar check as in the Add form.

**File**: `src/components/EditTransactionSheet.tsx`

---

## Summary

| File | Change |
|------|--------|
| `src/components/TransactionItem.tsx` | Wrap CategoryIcon + badge in relative container; badge becomes absolute overlay (w-4 h-4, ring border) |
| `src/components/AddTransactionSheet.tsx` | Show `<img>` for partner avatar in selected display (line 665) and dropdown list (line 709) |
| `src/components/EditTransactionSheet.tsx` | Same avatar image fix for selected display (line 574) and dropdown list (line 618) |


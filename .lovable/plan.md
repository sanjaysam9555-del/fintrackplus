

## Add Column View Toggle for Desktop Project Detail

### What
On desktop (≥768px), add a toggle button in the project detail header area that switches between:
- **List view** (current): Collapsible sections stacked vertically
- **Column view** (new): Income, Expenses, and Vendor Payments displayed as 3 side-by-side columns, all expanded

### Changes

**`src/components/ProjectDetailSheet.tsx`**

1. **Add state and imports**: Import `useIsMobile`, add `Columns3` and `List` icons from lucide. Add `viewMode` state (`'list' | 'columns'`), default to `'list'`.

2. **Toggle button**: Below the financial summary grid (around line 442), render a toggle button only when `!isMobile`. Two icon buttons: list icon and columns icon, with active state styling.

3. **Column layout**: When `viewMode === 'columns'` and not mobile, render Income, Expenses, and Vendor Payments in a `grid grid-cols-3 gap-4` layout instead of stacked collapsibles:
   - Each column has a header (icon + title + total) and a scrollable list of `TransactionItem` entries below
   - Vendor column shows vendor sub-groups with their transactions inline
   - All sections are always expanded (no collapsible wrappers)

4. **List layout**: Keep existing collapsible layout unchanged when `viewMode === 'list'` or on mobile.

### Files to change
| File | What |
|------|------|
| `src/components/ProjectDetailSheet.tsx` | Add view toggle, column layout for desktop |


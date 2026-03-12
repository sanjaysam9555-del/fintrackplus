

## Add Column View Toggle to Partner Detail Sheet (Desktop)

### What
On desktop, add a list/columns toggle to the Partner Detail Sheet so users can view Income and Expense entries side-by-side in a 2-column layout instead of stacked collapsibles.

### Changes

**`src/components/settings/PartnerDetailSheet.tsx`**

1. **Imports**: Add `useIsMobile` hook, `List` and `Columns3` icons from lucide-react.

2. **State**: Add `viewMode` state (`'list' | 'columns'`), default `'list'`.

3. **Toggle button**: Below the balance summary cards, render a toggle (only when `!isMobile`) with List and Columns3 icons, with active state styling matching the project detail pattern.

4. **Column layout**: When `viewMode === 'columns'` and not mobile, render Income and Expense as two side-by-side columns in a `grid grid-cols-2 gap-4` layout:
   - Each column has a colored header (icon + title + count + total amount)
   - Scrollable transaction list below, always expanded (no collapsible)
   - Empty state per column if no transactions of that type

5. **List layout**: Keep existing collapsible layout unchanged when `viewMode === 'list'` or on mobile.

### Files to change
| File | What |
|------|------|
| `src/components/settings/PartnerDetailSheet.tsx` | Add view toggle, 2-column layout for desktop |


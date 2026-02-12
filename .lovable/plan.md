

# Center-Align Numbers in Summary Cards

## Change

In `src/components/SummaryCard.tsx`, add `text-center` to the inner content elements (title row, amount, and percent change) so the numbers and labels are centered within each card.

### File: `src/components/SummaryCard.tsx`

- **Line 81**: Change the title row from `flex items-center gap-1.5 mb-1` to `flex items-center justify-center gap-1.5 mb-1` to center the icon + title.
- **Line 90**: Add `text-center` to the amount paragraph: `"text-sm lg:text-lg font-bold truncate text-center"`.
- **Line 100**: Add `text-center` to the percent change paragraph.

This keeps the card layout intact but centers all content horizontally within each card.


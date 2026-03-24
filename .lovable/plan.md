

## Fix Desktop Settings Layout: Balance Columns & Reposition Buttons

### Problem
The two-column layout is unbalanced — the left column has all the menu sections (Data Management, Team & Approvals, Backup) while the right column has smaller preference cards. The Install App and Sign Out buttons sit awkwardly at the bottom of the right column only.

### Fix

**`src/components/SettingsPage.tsx`** — Restructure the two-column grid:

1. **Move Install App and Sign Out outside the grid** — Place them in a full-width row below the two-column grid, side by side on desktop (like a footer bar). This removes the odd placement from the right column.

2. **Redistribute content for balanced columns**:
   - **Left column**: Profile Card, Learn App Features, Data Management menu section
   - **Right column**: Team & Approvals, Backup, Default Time Frame, Sync, Appearance (Theme)
   
   Move the Profile Card and Learn App Features *inside* the grid's left column (above menu sections) instead of being full-width above the grid. This fills out the left column and balances the heights.

3. **Install App + Sign Out footer**: Render as a `md:flex md:gap-4` row below the grid — Install App as a compact button, Sign Out next to it. On mobile, keep them stacked vertically as-is.

4. **Branding stays full-width** below the footer buttons.

### Files to modify
| File | Change |
|---|---|
| `src/components/SettingsPage.tsx` | Restructure grid: move profile/features into left column, split menu sections across columns, move Install/SignOut to full-width footer row |


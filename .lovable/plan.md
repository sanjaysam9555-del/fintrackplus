

# Unify Project Financial Metrics

## Problem

The current code uses inconsistent metrics and formulas across three areas:
- **Portfolio summary**: Shows Cost, Spent, Margin (Client Cost - Internal Cost)
- **Project cards**: Show Income, Spent, Net (Income - Spent)
- **Project detail sheet**: Shows Internal Cost, Client Cost, Expenses, Margin (Client Cost - Internal Cost)

The user wants a consistent 4-metric model everywhere with the correct Net Margin formula.

## New 4-Metric Model

| Metric | Label | Source | Color |
|--------|-------|--------|-------|
| 1 | Client Cost | `project.clientCost` | Foreground (white/black) |
| 2 | Internal Cost | `project.internalCost` | Foreground (white/black) |
| 3 | Expenses | `getProjectSpending(id)` (actual expenses) | Red |
| 4 | Net Margin | `clientCost - expenses (actual)` | Green if positive, Red if negative |

## Files Changed

### 1. `src/components/ProjectOverviewPage.tsx`

**Portfolio Summary (lines 320-361)**: Replace the 3-column grid (Cost / Spent / Margin) with a 4-column grid:
- Client Cost (with Wallet icon, blue)
- Internal Cost (with a suitable icon, foreground)
- Expenses (with Receipt icon, red)
- Net Margin = `totalClientCost - totalSpent` (dynamic green/red)

Update the totals calculation to use the new formula for net margin.

**Project Cards (lines 591-614)**: Replace the 3-column stats row (Income / Spent / Net) with 4 metrics:
- Client Cost
- Internal Cost
- Expenses (actual spent)
- Net Margin = `clientCost - spent`

### 2. `src/components/ProjectDetailSheet.tsx`

**Financial Summary grid (lines 259-281)**: Update the 2x2 grid to show:
- Client Cost (was already there)
- Internal Cost (was already there)
- Expenses (keep as is)
- Net Margin = `clientCost - spent` (currently shows `clientCost - internalCost` as "Margin")

### 3. `src/components/settings/ProjectsSection.tsx`

**Project cards financial section**: Update the 3-column grid (Cost / Spent / Net) to show 4 metrics in a 2x2 grid:
- Client Cost
- Internal Cost
- Expenses (actual spent)
- Net Margin = `clientCost - spent`

Rename labels to match: "Client Cost", "Internal Cost", "Expenses", "Net Margin".

### 4. Form labels (in both ProjectOverviewPage and ProjectsSection)

Update the "Margin" preview label in the add/edit forms to "Net Margin" and change the formula shown to reflect `Client Cost - Expenses` with a note that this will be calculated from actual expenses once transactions are added.

## Technical Notes

- The `formatCompactCurrency` function is already available for compact number display on mobile
- No database or type changes needed -- all data fields already exist
- The portfolio summary on mobile will use a 2x2 grid instead of 4 columns to avoid cramping
- The project card stats will use a 2x2 grid for readability on mobile


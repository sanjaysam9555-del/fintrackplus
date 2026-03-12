

## Simplify Project Financials to 3 Auto-Calculated Metrics

### What the user wants
Projects should only show **Income**, **Expense**, and **Balance/Margin** (all auto-calculated from transactions). Remove:
- "Cost to Client" field from add/edit forms and display cards
- Any manual entry options for project financials

### Changes

**1. `src/components/ProjectOverviewPage.tsx`**
- **Portfolio Summary**: Change from 2x2 grid to 3-column grid showing only Income, Expenses, Net Margin. Remove "Cost to Client" cell.
- **Add Project Form** (lines 264-268): Remove the "Cost Given to Client" input field.
- **Edit Form** (lines 637-642): Remove the "Cost Given to Client" input field.
- **Project Cards** (lines 762-798): Change from 2x2 grid to 3-column grid — Income, Expenses, Net Margin only.
- Remove `totalClientCost` calculation and related imports (`Wallet`).

**2. `src/components/ProjectDetailSheet.tsx`**
- **Edit Form** (lines 344-353): Remove "Cost to Client" input.
- **Financial Summary** (lines 427-458): Change from 2x2 grid to 3-column grid — Income, Expenses, Net Margin only. Remove "Cost to Client" cell.

**3. `src/components/ai-summary/ProjectHealth.tsx`**
- Already uses spent/income which are auto-calculated — no changes needed.

### Files to change
| File | What |
|------|------|
| `src/components/ProjectOverviewPage.tsx` | Remove Cost to Client from summary, add form, edit form, and project cards; switch to 3-col grids |
| `src/components/ProjectDetailSheet.tsx` | Remove Cost to Client from edit form and financial summary; switch to 3-col grid |


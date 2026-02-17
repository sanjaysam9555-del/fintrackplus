

# Fix Progress Bar to Reflect Expenses vs Income

## Problem
The progress bar on project cards uses `internalCost` (budget) as the denominator, and only shows when `internalCost > 0`. It should instead show **Expenses as a percentage of Income**, turning red at 80%.

The AI Summary "Project Health" component also uses `internalCost` for its calculations.

## Changes

### 1. `src/components/ProjectOverviewPage.tsx` -- Project Cards

**Update variables (lines 470-474):**
- Remove `remaining`, `healthStatus`, `isOverBudget` based on `internalCost`
- Change `budgetPercent` from `spent / internalCost` to `spent / income`
- Change `isOverBudget` to `income > 0 && spent > income`

**Update progress bar (lines 717-742):**
- Remove the `internalCost > 0` condition -- show the bar whenever `income > 0`
- Change the label from `spent / internalCost` to `spent / income`
- Turn the bar red (`destructive`) when percent >= 80%, amber when >= 60%, green otherwise
- Show "Over income!" when expenses exceed income

### 2. `src/components/ai-summary/ProjectHealth.tsx`

**Update filter (line 44):**
- Change from `p.internalCost > 0` to `p.income > 0` (show projects with income)

**Update percent calculation (line 52):**
- Change from `p.spent / p.internalCost` to `p.spent / p.income`

**Update thresholds (lines 24-40):**
- Keep 80% amber, 100% red logic (already correct)

**Update labels (lines 104-107):**
- Change "Internal Cost" label to "Income"
- Show `project.income` instead of `project.internalCost`


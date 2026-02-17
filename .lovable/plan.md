

# Unify Project Forms and Detail Views to 4-Metric Model

## Problem
The project card grids and portfolio summary were updated to show only 4 metrics, but the following were missed:
- **Add/Edit forms** in both Projects Tab and Settings still have "Internal Cost" and "Expected Margin" input fields
- **ProjectDetailSheet** financial summary still shows all 6 metrics (Internal Cost + Expected Margin)
- **Settings project cards** still use the old text-based layout instead of the unified 4-metric model

## Changes

### 1. `src/components/ProjectOverviewPage.tsx` -- Add Form
Remove the "Internal Cost" and "Expected Margin" input fields from the inline add project form (lines 210-229). Keep only:
- Project name
- Description
- Client Cost (single full-width input)
- Color picker and labels

Remove the "Est. Net Margin" preview since it depended on Internal Cost.

### 2. `src/components/ProjectDetailSheet.tsx` -- Financial Summary
Replace the 3x2 grid (lines 259-291) with a 2x2 grid showing only:
1. Cost to Client
2. Income (Actual)
3. Expenses (Actual)
4. Net Margin (Client Cost - Expenses)

Remove the "Internal Cost" and "Expected Margin" cells.

### 3. `src/components/settings/ProjectsSection.tsx` -- Add/Edit Form
Remove the "Internal Cost" and "Expected Margin" input fields from `renderFormFields` (lines 127-144). Remove the "Est. Net Margin" preview row. Keep only Client Cost as the financial input.

### 4. `src/components/settings/ProjectsSection.tsx` -- Project Cards
Replace the old text-based financial summary (lines 389-430) with the same 2x2 grid with dividers, icon badges, and centered alignment used in the Projects Tab cards:
- Cost to Client (Wallet icon)
- Income (green ArrowDown icon)
- Expenses (red TrendingDown icon)
- Net Margin (dynamic green/red TrendingUp/Down icon)

### Summary of Removed Fields
- "Internal Cost" input -- removed from all add/edit forms
- "Expected Margin" input -- removed from all add/edit forms
- "Est. Net Margin" preview -- removed from forms
- Internal Cost and Expected Margin display cells -- removed from ProjectDetailSheet

The `internalCost` and `expectedMargin` fields remain in the data model and database for backward compatibility but are no longer surfaced in the UI.

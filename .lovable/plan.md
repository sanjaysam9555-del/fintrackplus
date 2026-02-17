

# Add Expected Margin + Income to Project Financial Metrics

## Overview

Update the project financial model from 4 metrics to 6 metrics across all views, adding "Income (Actual)" and "Expected Margin" (user-entered field).

## New 6-Metric Model

| # | Label | Source | Notes |
|---|-------|--------|-------|
| 1 | Client Cost | `project.clientCost` | Existing field |
| 2 | Internal Cost | `project.internalCost` | Existing field |
| 3 | Income (Actual) | `getProjectIncome(id)` | Already computed but not displayed |
| 4 | Expenses (Actual) | `getProjectSpending(id)` | Already computed |
| 5 | Expected Margin | `project.expectedMargin` | **New field** -- user enters manually |
| 6 | Net Margin | `clientCost - expenses` | Calculated |

## Database Migration

Add an `expected_margin` column to the `projects` table:

```sql
ALTER TABLE public.projects ADD COLUMN expected_margin numeric NOT NULL DEFAULT 0;
```

## Changes by File

### 1. `src/lib/types.ts`
- Add `expectedMargin: number` to the `Project` interface

### 2. `src/lib/store.ts`
- Map `expectedMargin` to/from DB column `expected_margin` in all project CRUD operations (addProject, updateProject, cloud sync reads)
- Include `expectedMargin` in the form data defaults

### 3. `src/components/ProjectOverviewPage.tsx`

**Portfolio Summary** (lines 328-373): Expand from 2x2 to 3x2 grid:
- Row 1: Client Cost | Internal Cost
- Row 2: Income (Actual) | Expenses (Actual)
- Row 3: Expected Margin | Net Margin

Add `totalIncome` calculation alongside existing totals.

**Add Project Form** (lines 206-227): Add an "Expected Margin" input field.

**Project Cards** (lines 606-632): Expand the 2x2 compact stats to a 3x2 grid showing all 6 metrics.

### 4. `src/components/ProjectDetailSheet.tsx`

**Financial Summary** (lines 259-281): Expand from 2x2 to 3x2 grid adding Income (Actual) and Expected Margin cells.

### 5. `src/components/settings/ProjectsSection.tsx`

**Form fields** (lines 124-143): Add an "Expected Margin" input field to the add/edit form. Update `formData` state to include `expectedMargin`.

**Project cards** (lines 380-430): Expand the financial summary grid from 2x2 to 3x2, adding Income (Actual) via `getProjectIncome` and Expected Margin from the project data.

### 6. Styling Details

- Income (Actual): Green text with downward arrow icon (money coming in)
- Expenses (Actual): Red text (existing)
- Expected Margin: Foreground text (static user-entered value)
- Net Margin: Dynamic green/red based on positive/negative
- All grids use `grid-cols-2` with 3 rows for clean mobile readability

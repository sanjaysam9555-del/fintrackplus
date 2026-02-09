
# Rename Project Fields: Internal Cost, Client Cost, Auto-Calculated Margin

## Overview

Replace the current "Budget Limit" and "Margin" fields with a new model:
- **Internal Cost**: What the project actually costs you (replaces `budgetLimit`)
- **Client Cost**: What you charge the client (new field)
- **Margin**: Automatically calculated as `Client Cost - Internal Cost` (no longer manually entered)

All budget tracking, progress bars, and health indicators will use **Internal Cost** as the target to not breach.

## Data Model Change

| Current | New |
|---------|-----|
| `budgetLimit` (manual) | `internalCost` (manual) -- same DB column `budget_limit` |
| `margin` (manual) | `clientCost` (manual) -- repurpose DB column `margin` to store `client_cost` |
| -- | `margin` (auto-calculated: clientCost - internalCost) |

Since the DB already has `budget_limit` and `margin` columns, we will:
- Keep `budget_limit` column as-is, mapped to `internalCost` in the app
- Repurpose the `margin` column to store `clientCost` instead
- Margin becomes a purely computed value (clientCost - internalCost), never stored

No database migration needed -- just re-map the fields in the app code.

---

## Files to Modify

### 1. `src/lib/types.ts` -- Update Project Interface

```typescript
export interface Project {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  internalCost: number;   // was budgetLimit
  clientCost: number;     // was margin (repurposed)
  color: string;
  archived?: boolean;
  createdAt: string;
}
```

### 2. `src/lib/store.ts` -- Update Store Logic

- Rename all `budgetLimit` references to `internalCost`
- Rename all `margin` references to `clientCost`
- Update sync queue mapping: `budget_limit` maps to `internalCost`, `margin` maps to `clientCost`
- Update notification change tracking labels

### 3. `src/lib/syncEngine.ts` -- Update Sync Mapping

- Map DB `budget_limit` to `internalCost`
- Map DB `margin` to `clientCost`

### 4. `src/components/settings/ProjectsSection.tsx` -- Update Form

Replace the form fields:
- "Budget limit" input becomes **"Internal Cost (your cost)"**
- "Expected margin" input becomes **"Client Cost (what you charge)"**
- Add a read-only **Margin display** that auto-calculates: `clientCost - internalCost`
- Progress bar label changes from "Budget" to "Internal Cost"

### 5. `src/components/ProjectOverviewPage.tsx` -- Update Cards and Summary

- Portfolio summary: "Budget" becomes "Internal Cost", "Margin" shows computed `clientCost - internalCost`
- Card stats grid: Replace "Budget" with "Internal Cost", add "Client Cost", show computed "Margin"
- Budget progress bar tracks against `internalCost`
- Health status logic uses `internalCost` as the threshold

### 6. `src/components/ProjectDetailSheet.tsx` -- Update Detail View

- Update financial summary to show Internal Cost, Client Cost, and computed Margin
- Budget progress tracks against `internalCost`

### 7. `src/components/ai-summary/ProjectHealth.tsx` -- Update Health Widget

- Replace `budgetLimit` with `internalCost`
- Labels change from "Budget" to "Internal Cost"

### 8. `src/components/settings/ReportsSection.tsx` -- Update PDF Reports

- Update any report labels from "Budget" to "Internal Cost" and include "Client Cost"

---

## UI Behavior

### Project Creation/Edit Form

```
[Project Name          ]
[Description           ]
[Internal Cost (₹)     ]  -- your actual cost
[Client Cost (₹)       ]  -- what you charge client
Margin: ₹X,XXX          -- auto-calculated, shown as read-only text
[Color picker          ]
[Add Project]
```

### Project Card (Overview Page)

Stats grid changes from:
```
Income | Expenses | Budget | Net
```
to:
```
Income | Expenses | Internal Cost | Client Cost
```

With margin shown as a computed label.

### Budget Tracking

All progress bars, "over budget" warnings, and health indicators compare **spent vs internalCost** (the target is to not exceed your internal cost).

---

## Technical Details

- No database migration required -- reusing existing columns with new semantic meaning
- Margin is always computed: `project.clientCost - project.internalCost`
- Existing data: current `budget_limit` values become `internalCost`, current `margin` values become `clientCost`
- All `getProjectSpending()` comparisons switch from `budgetLimit` to `internalCost`

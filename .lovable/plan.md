

# Redesign Financial Summary in Project Cards

## Changes to `src/components/settings/ProjectsSection.tsx`

### 1. Reduce section height
- Tighten the padding on the financial summary section: reduce `pt-3` to `pt-2` and `space-y-2` to `space-y-1.5`
- Make the progress bar slimmer: `h-1.5` to `h-1`

### 2. Add colored icons to each metric
Import `IndianRupee` (or `CircleDollarSign`) and `TrendingUp`/`TrendingDown` from lucide-react for the icons. Each metric gets a small icon next to its label:

- **Cost** (currently "Budget"): Blue icon (`text-blue-500`)
- **Spent**: Red icon (`text-red-500`), number styled white (`text-foreground`) like Cost
- **Net** (currently "Margin"): Green icon + number when positive, red icon + number when negative

### 3. Rename "Margin" to "Net"
Change the label text from "Margin" to "Net" in the financial grid.

### 4. Color rules for values
- Cost number: `text-foreground` (white in dark mode)
- Spent number: `text-foreground` (white in dark mode, same as Cost) -- currently it turns red when over budget, keep that behavior
- Net number: `text-green-600 dark:text-green-400` when positive, `text-destructive` when negative

### Technical Detail

Lines ~380-416 of the file will be updated. The 3-column grid stays, but each cell gets an icon+label row and properly colored values:

```tsx
<div className="border-t border-border pt-2 space-y-1.5">
  <div className="grid grid-cols-3 gap-2">
    <div>
      <div className="flex items-center gap-1">
        <Wallet size={11} className="text-blue-500" />
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Cost</p>
      </div>
      <p className="text-sm font-semibold text-foreground">...</p>
    </div>
    <div>
      <div className="flex items-center gap-1">
        <TrendingDown size={11} className="text-red-500" />
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Spent</p>
      </div>
      <p className="text-sm font-semibold text-foreground">...</p>
    </div>
    <div>
      <div className="flex items-center gap-1">
        <TrendingUp size={11} className={net >= 0 ? 'text-green-500' : 'text-red-500'} />
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Net</p>
      </div>
      <p className={`text-sm font-semibold ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>...</p>
    </div>
  </div>
  <!-- progress bar with h-1 -->
</div>
```

Also update the form's computed margin label from "Margin" to "Net" (line ~125 area).

Only one file changes: `src/components/settings/ProjectsSection.tsx`.

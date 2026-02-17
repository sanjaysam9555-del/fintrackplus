

# Match Project Card Layout to Portfolio Summary

## What Changes

The individual project cards (lines 636-670) currently use a plain text grid without icons, dividers, or center alignment. The portfolio summary section (lines 338-401) uses a polished layout with:
- `gap-px bg-border` creating thin divider lines between cells
- Centered content (`items-center`)
- Icon badges (colored background circles with icons)
- Rounded overflow container

The project cards will be updated to match this exact style.

## File: `src/components/ProjectOverviewPage.tsx`

Replace the compact stats grid (lines 636-670) with the same layout pattern used in the portfolio summary:

```
grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden
```

Each cell will have:
- A small icon badge (w-6 h-6 rounded-lg with colored background)
- Centered label text
- Centered value text with appropriate coloring

The 6 metrics remain the same:
1. Client Cost -- Wallet icon, accent bg, foreground text
2. Internal Cost -- PiggyBank icon, accent bg, foreground text
3. Income -- ArrowDown icon, green bg, green text
4. Expenses -- Receipt icon, red bg, red text
5. Exp. Margin -- Wallet icon, accent bg, foreground text
6. Net Margin -- TrendingUp/Down icon, dynamic green/red

The budget progress bar above the grid stays unchanged.

### Technical Detail

Lines 635-670 will be replaced with:

```tsx
<div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden mt-1">
  <div className="bg-card p-2 flex flex-col items-center gap-0.5">
    <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center">
      <Wallet size={12} className="text-accent-foreground" />
    </div>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Client Cost</p>
    <p className="text-xs font-bold text-foreground">...</p>
  </div>
  <div className="bg-card p-2 flex flex-col items-center gap-0.5">
    <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center">
      <PiggyBank size={12} className="text-accent-foreground" />
    </div>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Internal Cost</p>
    <p className="text-xs font-bold text-foreground">...</p>
  </div>
  <!-- Income, Expenses, Exp. Margin, Net Margin cells follow same pattern -->
</div>
```

Only one file changes: `src/components/ProjectOverviewPage.tsx`.

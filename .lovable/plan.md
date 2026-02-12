
# Dark Mode Text & Color Readability Fix

## Problems Identified

1. **Greyish text everywhere**: The `--muted-foreground` variable (currently `215 20% 72%`) is used extensively across the app for labels, section headers, date groups, subtitles, currency symbols, and more. At 72% lightness with low saturation, it appears as a dull grey that's hard to read on dark surfaces.

2. **Red/destructive colors look muddy**: The `--destructive` variable (`0 72% 60%`) uses pure red (hue 0) which looks washed out on dark backgrounds. The `--destructive-light` background (`0 50% 15%`) also lacks enough contrast with the text it contains.

## Changes (File: `src/index.css`)

### 1. Brighten muted-foreground text

Increase lightness from 72% to 78% and add a touch more saturation so secondary text is clearly readable without overpowering primary text:

- `--muted-foreground`: from `215 20% 72%` to `215 25% 78%`

### 2. Fix destructive/red colors for dark mode

Shift the hue slightly toward warm red (from 0 to 4) and increase lightness so red icons, badges, and text are vibrant and distinct:

- `--destructive`: from `0 72% 60%` to `4 80% 64%`
- `--destructive-light`: from `0 50% 15%` to `4 50% 16%`
- `--destructive-foreground`: add explicitly as `0 0% 100%` (ensure white text on red backgrounds)
- `--chart-expense`: from `0 72% 65%` to `4 80% 68%` (match the brighter red in charts)

### 3. OLED mode -- same improvements

Apply the same muted-foreground and destructive adjustments in the `.dark.oled` block:

- `--muted-foreground`: `215 25% 78%` (inherited from dark, but explicitly set for clarity)

## Summary of Variable Changes

| Variable | Old Value | New Value |
|---|---|---|
| `--muted-foreground` | `215 20% 72%` | `215 25% 78%` |
| `--destructive` | `0 72% 60%` | `4 80% 64%` |
| `--destructive-light` | `0 50% 15%` | `4 50% 16%` |
| `--chart-expense` | `0 72% 65%` | `4 80% 68%` |

## Impact

- All section headers ("Navigation", "Tools", date groups, labels) become clearly readable
- Currency symbols in forms become brighter
- Red expense amounts, delete icons, error badges, and trend indicators become vivid and distinct
- Charts show a warmer, more visible red for expense data
- No component code changes needed -- everything uses CSS variables

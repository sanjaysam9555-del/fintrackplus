

# Dark Mode Optimization for Better Readability

## Problem

The current dark mode has very poor contrast. The background (`222 47% 8%`), cards (`222 47% 11%`), and borders (`222 30% 20%`) are all too close in lightness, making the UI look like a single dark blob. Muted foreground text (`215 20% 65%`) is also hard to read against these dark surfaces.

## Solution

Tune the dark mode CSS variables in `src/index.css` to improve contrast, readability, and visual hierarchy while maintaining the app's design language.

### Changes to `.dark` theme block (src/index.css, lines 105-160)

**Backgrounds -- increase card/surface separation:**
- `--background`: Keep at `222 47% 8%` (deep base is fine)
- `--card`: Brighten from `222 47% 11%` to `222 35% 14%` (more visible card elevation)
- `--popover`: Match card at `222 35% 14%`

**Text -- boost muted text readability:**
- `--muted-foreground`: Brighten from `215 20% 65%` to `215 20% 72%` (clearer secondary text)
- `--foreground`: Keep at `210 40% 98%` (already good)

**Borders and Inputs -- make edges visible:**
- `--border`: Brighten from `222 30% 20%` to `222 20% 25%`
- `--input`: Match border at `222 20% 25%`

**Secondary/Muted surfaces -- more separation:**
- `--secondary`: Brighten from `222 30% 15%` to `222 25% 18%`
- `--muted`: Brighten from `222 30% 18%` to `222 25% 20%`

**Accent -- slightly brighter for visibility:**
- `--accent`: Adjust from `214 50% 20%` to `214 50% 22%`
- `--accent-foreground`: Brighten from `214 78% 70%` to `214 78% 75%`

**Semantic colors -- brighter for dark backgrounds:**
- `--success`: Bump from `142 71% 50%` to `142 71% 55%`
- `--destructive`: Bump from `0 72% 55%` to `0 72% 60%`
- `--warning`: Bump from `38 92% 55%` to `38 92% 60%`

**Glass effects -- lighter glass for visibility:**
- `--glass-bg`: From `rgba(30, 41, 59, 0.9)` to `rgba(38, 50, 72, 0.92)`
- `--glass-border`: From `rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.12)`

**Sidebar -- match improved values:**
- `--sidebar-accent`: From `222 30% 15%` to `222 25% 18%`
- `--sidebar-border`: From `222 30% 20%` to `222 20% 25%`

**Chart colors -- already have boosted values, further brighten:**
- `--chart-income`: From `142 71% 55%` to `142 71% 60%`
- `--chart-expense`: From `0 72% 60%` to `0 72% 65%`
- `--chart-primary`: From `214 78% 55%` to `214 78% 60%`

### OLED mode adjustments (lines 163-179)

Slightly brighten OLED borders and surfaces for minimum usability:
- `--card`: From `0 0% 5%` to `0 0% 7%`
- `--secondary`: From `0 0% 8%` to `0 0% 10%`
- `--muted`: From `0 0% 10%` to `0 0% 12%`
- `--border`: From `0 0% 12%` to `0 0% 15%`
- `--input`: Match border
- `--glass-border`: From `rgba(255, 255, 255, 0.05)` to `rgba(255, 255, 255, 0.08)`

## File Changed

- `src/index.css` -- dark mode and OLED CSS variable values only

## Result

Cards will visibly "float" above the background, text will be clearly readable, borders will define element boundaries, and semantic colors (green/red/orange) will pop against dark surfaces -- all without changing the overall deep-slate aesthetic.


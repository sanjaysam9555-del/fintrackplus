
# New Landing Section: "From Event Chaos to Financial Clarity"

## Overview
Add a new `ChaosToClarity` section to the landing page that directly contrasts 4 "Old Way" struggles with their FinTrack⁺ solutions. It sits between `PainPointsSection` and `ComparisonSection` — emotionally escalating the problem before offering the solution table.

## Visual Design

The section uses a **two-column split layout** for each row:

- **Left column** — The Old Way (problem): dim, muted card with a red/destructive tone, slightly worn-down feeling
- **Right column** — The FinTrack⁺ Way (solution): vibrant card with a primary/green accent, and a real screenshot thumbnail

On mobile, the columns stack vertically (problem → solution, problem → solution) so the contrast is preserved row by row.

A subtle connecting arrow `→` sits between the two halves on desktop to reinforce the "before → after" narrative.

### Header Design
- Section badge: "Before vs. After"
- Heading: **"From Event Chaos to Financial Clarity"**
- Subtext: "This is what shifts when you switch to FinTrack⁺"

---

## The 4 Row Pairs

| # | Old Way Title | Solution Title | Solution Screenshot |
|---|---|---|---|
| 1 | Cash Leaks & WhatsApp Trails | Every Rupee Accounted For | `home-tab.png` (shows full overview) |
| 2 | Margin Blindness | Real-Time Profitability | `project-entries.png` (shows margin) |
| 3 | Partner Friction | Automated Partner Splits | `partners.png` |
| 4 | The CA "Clean-Up" Tax | CA-Ready in One Tap | `gst-form.png` |

---

## Technical Details

### New File: `src/components/landing/ChaosToClarity.tsx`

Structure:
```
<section>
  <!-- Section header with badge + heading -->
  
  <!-- 4 rows, each a motion-animated two-column card pair -->
  {rows.map((row, i) => (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
      
      <!-- Left: Problem card -->
      <motion.div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 ...">
        <div className="flex items-center gap-2 mb-2">
          <ProblemIcon class="text-destructive" />
          <span class="text-xs font-semibold text-destructive/80 uppercase">The Old Way</span>
        </div>
        <h3 class="font-semibold text-foreground">{row.problemTitle}</h3>
        <p class="text-sm text-muted-foreground mt-1">{row.problemDesc}</p>
      </motion.div>
      
      <!-- Arrow connector (desktop only) -->
      <div class="hidden md:flex items-center">
        <ArrowRight class="text-primary/60 w-6 h-6" />
      </div>
      
      <!-- Right: Solution card -->
      <motion.div className="bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden ...">
        <!-- Screenshot thumbnail (h-32) -->
        <img src={row.screenshot} class="w-full h-32 object-cover" />
        <!-- Content -->
        <div class="p-5">
          <div class="flex items-center gap-2 mb-2">
            <Check class="text-green-500" />
            <span class="text-xs font-semibold text-green-500/80 uppercase">FinTrack⁺ Way</span>
          </div>
          <h3 class="font-semibold text-foreground">{row.solutionTitle}</h3>
          <p class="text-sm text-muted-foreground mt-1">{row.solutionDesc}</p>
        </div>
      </motion.div>
      
    </div>
  ))}
</section>
```

**Animation**: Each row fades in and slides up with a staggered delay (`i * 0.12`s). Problem cards slide in from the left, solution cards from the right for a cinematic split reveal.

### Updated File: `src/pages/Landing.tsx`

Add the import and place the section **between `PainPointsSection` and `ComparisonSection`**:

```tsx
import { ChaosToClarity } from "@/components/landing/ChaosToClarity";

// In JSX:
<PainPointsSection />
<SectionDivider />
<ChaosToClarity />       // ← new
<SectionDivider />
<ComparisonSection />
```

This placement is intentional — pain points introduce the problem emotionally, this section contrasts them with real solutions, and then the comparison table closes the argument logically.

---

## Card Styling (matches existing landing page convention)

- Problem card: `bg-destructive/5 border-destructive/20` with `ring-1 ring-destructive/10`
- Solution card: `bg-primary/5 border-primary/20 shadow-[0_0_24px_rgba(25,102,205,0.12)] ring-1 ring-primary/10`
- Both cards use `backdrop-blur-sm rounded-2xl`
- Hover: `whileHover={{ scale: 1.02, y: -3 }}` on solution cards only

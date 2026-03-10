

# Redesign Deep Insights to Match Smart Insights Style

## Problem
Deep Insights cards are over-designed with too many visual layers (gradient header strips, nested callout boxes, category labels, severity dots). Smart Insights is cleaner because each card is a single flat container with icon + title + description — easy to scan.

## Approach
Adopt the same card pattern as Smart Insights: a single `rounded-xl border` container with a severity-based gradient background, an icon on the left, title + body on the right. The actionable tip becomes a second line of text (slightly differentiated) rather than a separate nested box.

## Changes — `src/components/ai-summary/DeepInsights.tsx`

**InsightCard redesign** to mirror SmartInsights pattern:
- Single flat card: `p-4 rounded-xl border backdrop-blur-sm` with severity-based gradient background (matching SmartInsights' `getInsightStyles` approach — green for info, amber for warning, red for critical)
- Left: `w-9 h-9 rounded-lg` icon using the category icon (Droplets, TrendingUp, etc.) with matching tinted background
- Right top: Title in `font-medium text-sm` with severity color + category badge as a small pill beside it
- Right middle: Body text in `text-xs text-muted-foreground leading-relaxed`
- Right bottom: Actionable tip prefixed with a "💡" or Lightbulb inline icon, in `text-xs font-medium` with slight primary tint — no nested box, just a single line/paragraph
- Remove: gradient header strip, nested "What to do" callout box, severity dot+label in top-right corner

**Severity → style mapping** (same as SmartInsights):
- `info` → emerald/green gradient border
- `warning` → amber gradient border  
- `critical` → red gradient border

**Keep unchanged**: Section header (Brain icon + "Deep Insights" + AI badge), loading skeleton, error state, animation staggering.

## Files Modified

| File | Change |
|------|--------|
| `src/components/ai-summary/DeepInsights.tsx` | Flatten InsightCard to match SmartInsights card style |


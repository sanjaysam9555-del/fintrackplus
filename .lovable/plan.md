

# AI-Powered Deep Insights for AI Summary Page

## Overview
Add a new "Deep Insights" section to the AI Summary page that uses Lovable AI (via an edge function) to analyze the user's financial data and generate rich, contextual insights like liquidity analysis, profitability patterns, vendor concentration, partner specialization, seasonality risks, and GST compliance observations.

## Architecture

```text
AISummaryPage
  └─ [Generate Insights] button / auto-trigger
       └─ Calls edge function: supabase/functions/ai-insights/index.ts
            └─ Receives summarized financial data (NOT raw transactions)
            └─ Calls Lovable AI Gateway (gemini-3-flash-preview)
            └─ Returns structured insights via tool calling
       └─ Renders in new DeepInsights component below SmartInsights
```

## Changes

### 1. New Edge Function: `supabase/functions/ai-insights/index.ts`
- Accepts a JSON payload of **pre-aggregated** financial summaries (totals, partner splits, vendor breakdowns, project margins, monthly trends, payment method splits, GST stats)
- Sends to Lovable AI Gateway with a detailed system prompt instructing it to generate 3-7 insights from the 7 categories (liquidity, profitability scaling, vendor concentration, partner specialization, dead money, GST compliance, seasonality)
- Uses **tool calling** to extract structured output: array of `{ title, category, severity, body, actionable_tip }`
- Returns JSON array of insights
- Handles 429/402 errors properly

### 2. New Component: `src/components/ai-summary/DeepInsights.tsx`
- Displays AI-generated insights in expandable accordion cards
- Each card shows: category badge, title, severity indicator, body text, and actionable tip
- Loading state with skeleton animation while AI generates
- "Regenerate" button to refresh insights
- Error state with retry option

### 3. Update: `src/components/AISummaryPage.tsx`
- Add data aggregation logic to prepare the summary payload:
  - Cash vs online balances per partner
  - Per-project margins (income vs expense)
  - Top vendor spending percentages
  - Monthly income/expense trend (for seasonality)
  - GST transaction percentage
  - Partner-level income/expense/payment-method breakdowns
- Add state for `deepInsights`, `isGenerating`, `error`
- Call the edge function on mount (or via button) when sufficient data exists
- Render `<DeepInsights>` below the existing `<SmartInsights>` section

### 4. Update: `supabase/config.toml`
- Add `[functions.ai-insights]` with `verify_jwt = true` (requires authenticated user)

## Data Payload Shape (sent to edge function)
```typescript
{
  fyIncome, fyExpense, netBalance,
  cashBalance, onlineBalance,           // aggregated across partners
  partnerBreakdowns: [{ name, cashIncome, cashExpense, onlineIncome, onlineExpense }],
  projectMargins: [{ name, clientCost, income, expense, marginPercent }],
  topVendors: [{ name, totalSpend, percentOfTotal }],
  monthlyTrend: [{ month, income, expense }],
  gstTransactionPercent,
  categoryBreakdown: [{ name, amount, percent }],
  paymentMethodSplit: { expenseCash, expenseOnline, incomeCash, incomeOnline }
}
```

This keeps raw transaction data off the wire and gives the AI model a clean summary to reason about.

## Files Modified/Created

| File | Action |
|------|--------|
| `supabase/functions/ai-insights/index.ts` | Create — edge function with AI gateway call |
| `src/components/ai-summary/DeepInsights.tsx` | Create — accordion-style AI insight cards |
| `src/components/AISummaryPage.tsx` | Update — aggregate data, call edge function, render DeepInsights |
| `supabase/config.toml` | Update — add ai-insights function config |


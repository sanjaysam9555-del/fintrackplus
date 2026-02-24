

# Add "Total Holdings" Card on Home Tab

## What This Solves
The Home tab "Balance" card currently shows **net profit** (Income - Expense = 14,45,428), but partner balances show **total holdings** (Initial Balances + Income - Expense = 18,45,428). The 4,00,000 gap is Swati's initial online balance. Adding a "Total Holdings" card makes both numbers visible so you can reconcile at a glance.

## Changes

### 1. Update Summary Cards layout (`src/components/Dashboard.tsx`)
- Compute `totalHoldings` = `netBalance` + sum of all partner initial balances (cash + online)
- Add a 4th summary card "Holdings" below the existing 3-card row (or as a separate prominent card)
- Only show this card when partners exist (to avoid clutter for users without partners)
- The card will use the existing `PartnerBalanceCard` component below the holdings card to show the per-partner breakdown

### 2. Add the PartnerBalanceCard to the Dashboard
- Import and render `PartnerBalanceCard` after the summary cards section
- Pass the current `dateRange` prop so it stays in sync with the selected time filter
- This already shows per-partner cash/online breakdown and is collapsible

### 3. Update SummaryCard to support a "holdings" type (`src/components/SummaryCard.tsx`)
- Add a `holdings` entry to the icon and color maps (using a wallet/vault icon)
- This keeps the card visually consistent with the other three

## Layout
```text
[ Income ]  [ Expense ]  [ Balance ]
        [ Total Holdings: 18,45,428 ]
        (only when partners exist)

[ Partner Balance Card - collapsible ]
  Sanjay: Cash / Online
  Swati:  Cash / Online
```

## Technical Details
- `totalHoldings = netBalance + partners.reduce((sum, p) => sum + p.initialCashBalance + p.initialOnlineBalance, 0)`
- The PartnerBalanceCard already accepts `dateRange` and handles all the per-partner math
- No database or schema changes needed
- No new files needed



# Restructure Holdings Display

## Changes

### 1. Dashboard Home Tab (`src/components/Dashboard.tsx`)
- Change the summary cards grid from `grid-cols-3` to `grid-cols-4` (on mobile, may use `grid-cols-2` with 2 rows for readability)
- Move the "Total Holdings" card INTO the same row as Income, Expense, Balance
- Remove the separate `PartnerBalanceCard` component from the Dashboard entirely
- Remove the `PartnerBalanceCard` import

### 2. Partners Page - Add Total Holdings Summary (`src/components/settings/PartnersSection.tsx`)
- Add a "Total Holdings" summary card at the top of the partners page (above the date filter)
- This card shows:
  - **Total Holdings** = sum of all partner closing balances (cash + online combined)
  - **Total Cash** = sum of all partner closing cash balances
  - **Total Online** = sum of all partner closing online balances
- This total is **unchanged by date selection** -- it always uses the full range (all-time) so it reflects actual current holdings
- The rest of the partner cards below continue to change with the date filter as they do today

### Technical Details

**Dashboard.tsx changes:**
- Change grid from `grid-cols-3` to `grid-cols-2 lg:grid-cols-4` so on mobile it wraps to 2x2 and on desktop all 4 are in one row
- Remove the separate Holdings card block and the PartnerBalanceCard block
- Keep `totalHoldings` calculation, just render it in the same grid

**PartnersSection.tsx changes:**
- Compute an "all-time" `totalHoldings` using a very wide date range (e.g., 2000-01-01 to 2099-12-31) to capture all transactions plus initial balances
- Add a summary card above the date filter showing Total Holdings, Total Cash, Total Online
- This card is static and does not respond to the date filter
- The existing per-partner cards and date filter remain unchanged


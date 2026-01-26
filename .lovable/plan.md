
# Partner Balance Tracking System

## Overview

This plan adds a comprehensive partner balance tracking system that solves the confusion of tracking who holds how much money (cash vs online) between two partners. Each transaction will be tagged with which partner handled it, and a new dashboard card will show real-time balances per partner broken down by payment method.

---

## Database Changes

### New Table: `partners`
Stores partner profiles for the business.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner of this partner record (for RLS) |
| name | text | Partner name (e.g., "You", "Partner 2") |
| color | text | Display color |
| initial_cash_balance | numeric | Starting cash balance |
| initial_online_balance | numeric | Starting online balance |
| created_at | timestamp | Creation timestamp |

### Update: `transactions` table
Add a new column to track which partner handled each transaction.

| Column | Type | Description |
|--------|------|-------------|
| partner_id | uuid (nullable) | References partners table |

---

## New Features

### 1. Partner Management in Settings
A new "Partners" section in Settings where you can:
- Add/edit partner names and colors
- Set initial cash and online balances for each partner
- View summary of each partner's current balance

### 2. Partner Selection in Transaction Forms
- Add a partner selector dropdown in both Add and Edit transaction sheets
- Shows partner name with color indicator
- Optional field (for backwards compatibility with existing transactions)

### 3. Partner Balance Dashboard Card
A new expandable card on the home page showing:

```text
┌──────────────────────────────────────┐
│  Partner Balances                    │
├──────────────────────────────────────┤
│  You                                 │
│    💵 Cash:    ₹12,500              │
│    💳 Online:  ₹45,000              │
├──────────────────────────────────────┤
│  Partner 2                           │
│    💵 Cash:    ₹8,200               │
│    💳 Online:  ₹22,000              │
└──────────────────────────────────────┘
```

### 4. Balance Calculation Logic
For each partner, the balance is calculated as:

**Cash Balance** = Initial Cash + Cash Income - Cash Expenses
**Online Balance** = Initial Online + Online Income - Online Expenses

Only transactions tagged with that partner are included.

---

## Files to Create/Modify

### New Files
1. **`src/components/settings/PartnersSection.tsx`** - Partner management UI
2. **`src/components/PartnerBalanceCard.tsx`** - Dashboard balance display card

### Modified Files
1. **`src/lib/types.ts`** - Add Partner interface
2. **`src/lib/store.ts`** - Add partner state and actions
3. **`src/lib/syncEngine.ts`** - Add partner sync logic
4. **`src/components/AddTransactionSheet.tsx`** - Add partner selector
5. **`src/components/EditTransactionSheet.tsx`** - Add partner selector
6. **`src/components/Dashboard.tsx`** - Add PartnerBalanceCard
7. **`src/components/SettingsPage.tsx`** - Add Partners menu item
8. **`src/components/TransactionItem.tsx`** - Show partner indicator

---

## Technical Details

### Database Migration SQL

```sql
-- Create partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  initial_cash_balance numeric NOT NULL DEFAULT 0,
  initial_online_balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own partners" 
  ON public.partners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own partners" 
  ON public.partners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own partners" 
  ON public.partners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own partners" 
  ON public.partners FOR DELETE USING (auth.uid() = user_id);

-- Add partner_id to transactions
ALTER TABLE public.transactions 
  ADD COLUMN partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;
```

### Store Balance Calculation

```typescript
getPartnerBalances: () => {
  const { transactions, partners } = get();
  
  return partners.map(partner => {
    const partnerTxns = transactions.filter(t => t.partnerId === partner.id);
    
    const cashIncome = partnerTxns
      .filter(t => t.type === 'income' && t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);
    const cashExpense = partnerTxns
      .filter(t => t.type === 'expense' && t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);
    const onlineIncome = partnerTxns
      .filter(t => t.type === 'income' && t.paymentMethod === 'online')
      .reduce((sum, t) => sum + t.amount, 0);
    const onlineExpense = partnerTxns
      .filter(t => t.type === 'expense' && t.paymentMethod === 'online')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      partner,
      cashBalance: partner.initialCashBalance + cashIncome - cashExpense,
      onlineBalance: partner.initialOnlineBalance + onlineIncome - onlineExpense,
    };
  });
}
```

### UI Component Structure

**Partner Selector (in transaction forms):**
- Appears after Payment Method selection
- Shows list of partners with color indicators
- Optional - can leave unassigned for legacy transactions

**Partner Balance Card:**
- Collapsible card in Dashboard
- Shows each partner with their cash and online balances
- Tapping a partner could filter transactions to show only theirs

---

## User Workflow

1. **Initial Setup**: Go to Settings → Partners → Add your two partner names and set starting balances
2. **Logging Transactions**: When adding income/expense, select which partner handled it
3. **Viewing Balances**: Dashboard shows real-time balance for each partner split by cash/online
4. **Reconciliation**: If balances seem off, check transaction history filtered by partner

---

## Edge Cases Handled

- **Existing transactions**: Will have null partner_id - shown as "Unassigned" in reports
- **Partner deletion**: Transactions keep partner_id but show as "Deleted Partner"
- **No partners set up**: Balance card hidden until at least one partner is added
- **Transfers between partners**: Can be logged as expense from one, income to other (same amount)

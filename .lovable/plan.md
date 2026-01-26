
# UI Cleanup Changes

## Overview

This plan implements three UI cleanup changes to streamline the home page and search experience:

1. **Move Partner Balances and Transfer section from Home to Settings**
2. **Remove the "See All" button on the home page**
3. **Remove filter button icons from search boxes**

---

## Changes Summary

### 1. Move Partner Balances to Settings

**Current behavior:**
- `PartnerBalanceCard` component is rendered on the Dashboard (Home tab) at line 617-619
- It shows partner balances and includes the "Transfer Between Partners" button

**Target behavior:**
- Remove `PartnerBalanceCard` from Dashboard
- Add it to the Settings page under the Partners section (or as a separate visible card on the main settings page)

**Files to modify:**
- `src/components/Dashboard.tsx` - Remove the PartnerBalanceCard import and usage
- `src/components/settings/PartnersSection.tsx` - Add PartnerBalanceCard display

---

### 2. Remove "See All" Button

**Current location:**
- `src/components/Dashboard.tsx` line 689:
  ```jsx
  <button className="text-sm text-primary font-medium">See All</button>
  ```

**Change:**
- Remove this button entirely from the Recent Transactions header

---

### 3. Remove Filter Button Icons from Search Boxes

**Current location:**
- `src/components/TransactionList.tsx` lines 372-374:
  ```jsx
  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
    <Filter size={18} />
  </button>
  ```

**Change:**
- Remove the Filter button from the search input in TransactionList
- Also update the Input `className` from `pl-10 pr-10` to just `pl-10` since there won't be a right element

---

## Implementation Details

### File: `src/components/Dashboard.tsx`

1. **Remove PartnerBalanceCard import** (line 8)
2. **Remove PartnerBalanceCard section** (lines 616-619):
   ```jsx
   {/* Partner Balance Card */}
   <div className="px-4 lg:px-0 mb-6">
     <PartnerBalanceCard />
   </div>
   ```
3. **Remove "See All" button** (line 689):
   ```jsx
   <button className="text-sm text-primary font-medium">See All</button>
   ```

### File: `src/components/TransactionList.tsx`

1. **Remove Filter icon import** (line 7): Remove `Filter` from the lucide-react import
2. **Remove Filter button** (lines 372-374)
3. **Update Input className** (line 370): Change from `pl-10 pr-10` to `pl-10`

### File: `src/components/settings/PartnersSection.tsx`

1. **Import PartnerBalanceCard** component
2. **Add PartnerBalanceCard** at the top of the section (before the partner list) so users can see their current balances and access the transfer feature

---

## Visual Changes

**Home Page (Before):**
```text
[Summary Cards]
[Partner Balances Card]  <-- REMOVED
[Cash Flow Chart]
[Quick Actions]
[Upcoming Recurring]
[Recent Transactions]
  Header: "Recent Transactions" | "See All"  <-- "See All" REMOVED
  [Transaction list...]
```

**Home Page (After):**
```text
[Summary Cards]
[Cash Flow Chart]
[Quick Actions]
[Upcoming Recurring]
[Recent Transactions]
  Header: "Recent Transactions"
  [Transaction list...]
```

**Settings > Partners (After):**
```text
[Back] Partners                    [Add]
[Partner Balance Card]  <-- ADDED HERE
  - Shows balances per partner
  - Transfer Between Partners button
[Partner list...]
```

**Transaction List Search (Before):**
```text
[🔍 Search vendor or category...      [Filter icon]]
```

**Transaction List Search (After):**
```text
[🔍 Search vendor or category...                  ]
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/Dashboard.tsx` | Remove PartnerBalanceCard import and usage, remove "See All" button |
| `src/components/TransactionList.tsx` | Remove Filter icon import and button, update Input className |
| `src/components/settings/PartnersSection.tsx` | Import and add PartnerBalanceCard at top of section |

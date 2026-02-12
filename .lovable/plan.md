

# Enrich Activity Logs with Full Details and Extended History

## Problems Found

1. **Log history capped at 50 entries** -- heavy users exhaust this in days, not a month
2. **"Added" entries have no details** -- when you add a transaction, category, project, vendor, or partner, the log only shows a brief message like "Vendor Name - Rs 5,000" with zero detail about what was actually created
3. **Partner creation has no log entry at all** -- the `addPartner` function is missing the `addNotification` call entirely
4. **Transaction add messages are vague** -- missing title, category, project, partner, and payment method info

## Changes

### File: `src/lib/store.ts`

**1. Increase log limit from 50 to 200** (line 239)
- Change `.slice(0, 50)` to `.slice(0, 200)`
- This comfortably covers a month of activity even for power users

**2. Enrich "Transaction Added" notification** (lines 305-309)
- Add `details` array showing: Title, Amount, Type, Vendor, Category, Project, Partner, Payment Method, Date
- Add `entityType: 'transaction'` and `entityId`
- Use the same name-resolution helpers (getCategoryName, getProjectName, getPartnerName) already used in update/delete

**3. Enrich "Category Added" notification** (lines 636-640)
- Add details: Name, Type, Icon
- Add `entityType: 'category'` and `entityId`

**4. Enrich "Project Added" notification** (lines 768-772)
- Add details: Name, Internal Cost, Client Cost, Description
- Add `entityType: 'project'` and `entityId`

**5. Enrich "Vendor Added" notification** (lines 925-929)
- Add details: Name, Icon
- Add `entityType: 'vendor'` and `entityId`

**6. Add missing "Partner Added" notification** (after line 1072)
- Currently completely missing -- add a notification with details: Name, Cash Balance, Online Balance
- Include `entityType: 'partner'` and `entityId`

**7. Enrich "Installment Confirmed" notification** (lines 599-603)
- Add details: Amount, Parent Transaction, Date
- Add `entityType: 'transaction'` and `entityId`

### Summary of detail fields added per entity

| Entity | Add Details |
|---|---|
| Transaction | Title, Amount, Type, Vendor, Category, Project, Partner, Payment, Date |
| Category | Name, Type, Icon |
| Project | Name, Internal Cost, Client Cost |
| Vendor | Name, Icon |
| Partner | Name, Cash Balance, Online Balance |

All "Added" log entries will now use the same structured before/after card UI (with "New" instead of "Before" for created entries -- the `from` field will show "New" and `to` will show the value).


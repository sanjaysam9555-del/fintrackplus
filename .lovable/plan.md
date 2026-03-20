

## Add Role Permissions Guide to Team Page

### What
Add an info button (e.g., `HelpCircle` icon) next to the "Team" title that opens a dialog/sheet showing a visual comparison table of what each role (Owner, Admin, Employee) can and cannot do.

### Permissions Matrix

| Permission | Owner | Admin | Employee |
|---|---|---|---|
| View Dashboard & Summaries | ✅ | ✅ | ❌ |
| Add Income/Expense | ✅ | ✅ | ✅ (own only) |
| Edit/Delete Transactions | ✅ | ✅ | ❌ |
| Manage Categories & Vendors | ✅ | ✅ | ❌ |
| Manage Projects | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ❌ |
| View Partner Balances | ✅ | ❌ | ❌ |
| Manage Team Members | ✅ | ❌ | ❌ |
| View Activity Logs | ✅ | ❌ | ❌ |
| Backup & Restore | ✅ | ❌ | ❌ |
| View Cashflow & AI Insights | ✅ | ✅ | ❌ |
| View Only Own Transactions | ❌ | ❌ | ✅ |

### UI Design
- Add `HelpCircle` icon button next to the "Team" header
- Opens a `Dialog` with a clean comparison table
- Three columns color-coded to match existing role badge colors (amber/blue/emerald)
- Check (✅) and X (❌) icons for each permission row
- Title: "Role Permissions Guide"

### Files to modify
| File | Change |
|---|---|
| `src/components/settings/TeamSection.tsx` | Add HelpCircle button + Dialog with permissions comparison table |


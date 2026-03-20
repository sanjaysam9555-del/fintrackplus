

## Fix Activity Logs: Include Team Member Names in Messages

### Problems Identified
1. **Notification messages are generic** — they say things like "Shop ABC" instead of "John updated vendor 'Shop ABC'". The actor name exists as a separate field but isn't embedded in the message text itself.
2. **DB is empty** — the migration added persistence, but old local-only notifications weren't migrated. Going forward, new actions will persist correctly.
3. **Message format doesn't clearly describe the action** — "Vendor Updated" with message "Shop ABC" doesn't tell you who did what.

### Fix

**`src/lib/store.ts`** — Update ALL `addNotification` calls to include the actor's name directly in the `message` field, making each log entry self-descriptive:

| Action | Current Message | New Message |
|---|---|---|
| Add transaction | `"Rent - ₹5,000"` | `"John added expense 'Rent' — ₹5,000"` |
| Edit transaction | `"Transaction modified"` | `"John edited transaction 'Rent'"` |
| Delete transaction | `"Rent"` | `"John deleted transaction 'Rent' — ₹5,000"` |
| Add vendor | `"Shop ABC"` | `"John added vendor 'Shop ABC'"` |
| Edit vendor | `"Shop ABC"` | `"John updated vendor 'Shop ABC'"` |
| Delete vendor | `"Shop ABC"` | `"John deleted vendor 'Shop ABC'"` |
| Add category | `"Food"` | `"John added category 'Food'"` |
| Edit category | `"Food"` | `"John updated category 'Food'"` |
| Delete category | `"Food"` | `"John deleted category 'Food'"` |
| Add project | `"Wedding"` | `"John added project 'Wedding'"` |
| Edit project | `"Wedding"` | `"John updated project 'Wedding'"` |
| Delete project | `"Wedding"` | `"John deleted project 'Wedding'"` |
| Add partner | `"Alice"` | `"John added partner 'Alice'"` |
| Edit partner | `"Alice"` | `"John updated partner 'Alice'"` |
| Delete partner | `"Alice — 3 txns unassigned"` | `"John deleted partner 'Alice' — 3 transactions unassigned"` |
| Add label | `"#urgent"` | `"John added label '#urgent'"` |
| Edit label | `"#urgent"` | `"John updated label '#urgent'"` |
| Delete label | `"#urgent"` | `"John deleted label '#urgent'"` |
| Partner transfer | `"₹5,000 transferred..."` | `"John transferred ₹5,000 from Alice to Bob"` |
| Profile name | `"Name updated"` | `"John changed name from 'Old' to 'New'"` |
| Theme changed | `"Theme changed"` | `"John changed theme to Dark"` |
| Export | `"Exported..."` | `"John exported data..."` |
| Settings | `"Default time frame changed"` | `"John changed default time frame"` |

The approach: Since `addNotification` already resolves `actorName` from `get().userProfile.name`, each call site will read `get().userProfile.name` and embed it into the message string before calling `addNotification`.

### Files to modify
| File | Change |
|---|---|
| `src/lib/store.ts` | Update ~25 `addNotification` calls to embed actor name in message text |
| `src/components/SettingsPage.tsx` | Update 1 `addNotification` call (theme change) to include actor name |


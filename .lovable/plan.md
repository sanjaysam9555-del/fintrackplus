

## Fix: Activity Logs Not Showing All Actions With Full Details

### Problem
The activity log (Notifications page) has two issues:
1. **Details not rendered**: Every notification already stores `details` (before/after changes) but the UI only shows a truncated `message` line — the rich change data is invisible.
2. **Label notifications are bare-bones**: Missing `details`, `entityType`, and `entityId` unlike every other entity type.
3. **Some actions not logged**: Theme changes, default time filter changes, and data clearing have no notifications.

### Changes

**1. Render before/after details in NotificationsPage** (`src/components/NotificationsPage.tsx`)
- Below each notification's message, render the `details` array when present:
  - For adds (field `from === 'New'`): show a compact "New entry" card with field values
  - For edits: show a "Before → After" grid for each changed field
  - For deletes (field `to === 'Deleted'`): show original values with strikethrough styling
- Expandable by default (first 3 items), with "Show more" if >3 fields

**2. Render details in NotificationPanel** (`src/components/NotificationPanel.tsx`)
- Same detail rendering but more compact (single-line per field) since the panel is narrower

**3. Enrich label notifications** (`src/lib/store.ts`)
- `addProjectLabel`: add `details` with Name and Color fields, plus `entityType`/`entityId`
- `updateProjectLabel`: build change diff like other entities (name, color changes)
- `deleteProjectLabel`: add details capturing original name and color

**4. Add missing action logs** (`src/lib/store.ts`, `src/components/SettingsPage.tsx`)
- Theme change: log when user switches light/dark/OLED
- Default time filter change: log when filter preference changes
- In `src/lib/store.ts` `setDefaultTimeFilter`: add notification

**5. Add filter tabs to logs page** (`src/components/NotificationsPage.tsx`)
- Horizontal scrollable filter chips: All, Entries, Categories, Vendors, Projects, Partners, Labels, Exports
- Filter notifications by `type` or `entityType`

### Files to change
| File | What |
|------|------|
| `src/components/NotificationsPage.tsx` | Render `details` array, add filter tabs |
| `src/components/NotificationPanel.tsx` | Render `details` in compact form |
| `src/lib/store.ts` | Enrich label notifications with details; add theme/filter change logs |
| `src/components/SettingsPage.tsx` | Fire notification on theme change |


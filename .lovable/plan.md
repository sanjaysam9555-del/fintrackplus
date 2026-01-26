

# Logs Section Rename & Calendar Fix

## Overview

This plan addresses two issues:

1. **Rename "Notifications" to "Logs"** - The notifications section in settings should be renamed to "Logs" to better reflect its purpose as an activity log of all add/delete/edit operations
2. **Fix Calendar Button on Home Page** - The calendar popover button isn't opening properly

---

## Issue Analysis

### 1. Notifications to Logs Rename

**Current state:**
- The section is called "Notifications" throughout the codebase
- The feature already logs all CRUD operations (add, edit, delete) for transactions, categories, vendors, projects, and partners
- The store already creates log entries via `addNotification()` for all these actions

**What needs to change:**
- Rename the menu item label from "Notifications" to "Logs" in `SettingsPage.tsx`
- Update the section header title from "Notifications" to "Activity Logs"
- Update empty state text to reflect "logs" terminology
- Change the icon from `Bell` to `FileText` or `ScrollText` (more appropriate for logs)

### 2. Calendar Button Not Opening

**Root cause identified:**
The Calendar component in `src/components/ui/calendar.tsx` is missing the `pointer-events-auto` class in its default className. While it's added when used in Dashboard.tsx (`className="p-2 pointer-events-auto"`), the base Calendar component should include it.

Looking at the console logs, there are also React warnings about refs on function components which may cause rendering issues. However, the primary issue is likely that the popover's calendar doesn't have proper pointer events enabled.

**Current code in calendar.tsx (line 14):**
```typescript
className={cn("p-3", className)}
```

**Should be:**
```typescript
className={cn("p-3 pointer-events-auto", className)}
```

This ensures the calendar is always interactive inside popovers and dialogs.

---

## Implementation Details

### File 1: `src/components/SettingsPage.tsx`

**Changes:**

1. **Update icon import** (line 14):
   - Replace `Bell` with `ScrollText` from lucide-react

2. **Update menu item** (lines 209-213):
   - Change label from "Notifications" to "Logs"
   - Change sublabel from "X unread" to "Activity history"
   - Update the icon from `Bell` to `ScrollText`

3. **Update section header** (line 242):
   - Change title from "Notifications" to "Activity Logs"

4. **Update empty state text** in `NotificationsContent` (lines 82-85):
   - Change "No notifications yet" to "No activity logs yet"
   - Change "Your activity will appear here" to "Your actions will be logged here"

5. **Update section type** (line 127):
   - Change `'notifications'` to `'logs'` in the union type

### File 2: `src/components/ui/calendar.tsx`

**Changes:**

1. **Add pointer-events-auto** (line 14):
   ```typescript
   className={cn("p-3 pointer-events-auto", className)}
   ```

This ensures the calendar is always interactive inside popovers and dialogs, fixing the click issue.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/SettingsPage.tsx` | Rename "Notifications" to "Logs", update icon, update section type and strings |
| `src/components/ui/calendar.tsx` | Add `pointer-events-auto` to default className |

---

## Visual Changes

**Settings Menu (Before):**
```text
[Bell icon] Notifications
           X unread
```

**Settings Menu (After):**
```text
[ScrollText icon] Logs
                  Activity history
```

**Logs Section Header (After):**
```text
[Back] Activity Logs
```

**Empty State (After):**
```text
[ScrollText icon]
No activity logs yet
Your actions will be logged here
```

---

## Technical Notes

- The existing notification/log system already captures all CRUD operations with appropriate types and messages
- No changes needed to the store's `addNotification` function - it continues to work the same way
- The feature is essentially an activity log, and this rename makes its purpose clearer to users
- The calendar fix ensures proper interactivity by adding the required `pointer-events-auto` class that prevents pointer events from being blocked by parent containers


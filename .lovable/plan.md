

# Redesign Activity Logs for Clarity

## Problem

The current log entries are hard to parse. The change details section uses a cramped inline layout (`field: ~~old~~ -> new`) with tiny text, muted colors, and a narrow fixed-width label column. It's not immediately clear what changed, what the old value was, and what the new value is.

## Solution

Redesign the log card UI in `src/components/SettingsPage.tsx` (the `NotificationsContent` component) to make changes visually distinct and scannable.

### UI Changes

**1. Better card header layout**
- Show the action type as a colored badge/pill (e.g., "Edited", "Deleted", "Added") next to the title
- Make the title bolder and the message more descriptive

**2. Redesigned change details table**
- Replace the cramped inline layout with a proper two-column "before/after" design
- Each changed field gets its own row with:
  - Field label as a clear header
  - "Before" value on the left with a subtle red/strikethrough treatment
  - "After" value on the right with a green highlight
- For "Deleted" entries, show all values with a red treatment and a "Deleted" badge instead of repeating "Deleted" for every field

**3. Visual hierarchy improvements**
- Use color-coded action badges: green for "Added", orange for "Edited", red for "Deleted", blue for "Exported"
- Increase font sizes slightly for readability
- Better spacing between log entries

### Technical Changes

**File: `src/components/SettingsPage.tsx` (NotificationsContent component, lines ~88-135)**

Replace the change details rendering with:

```
-- Action badge next to title (Added/Edited/Deleted) with color coding
-- For edit logs with details:
   A two-column card layout per field:
   | Field Name                    |
   | Before (red, dim)  | After (green, bright) |
   
-- For delete logs:
   Show deleted entity details in a single-column list with red accent
   
-- For add/export logs:
   Keep the simple message format but with clearer typography
```

**Specific code changes:**

1. Add an action badge helper that returns a colored pill based on notification type:
   - `transaction` (add) = green "Added"
   - `edit` = orange "Edited" 
   - `delete` = red "Deleted"
   - `export` = blue "Exported"

2. Replace the change details `div` (lines 116-125) with a structured before/after layout:
   - Field label row spans full width
   - Before value: `text-destructive/70 line-through text-xs`
   - After value: `text-success font-medium text-xs`
   - Visual arrow or divider between them

3. For delete notifications, instead of showing "to: Deleted" for every field, show a "This item was deleted" banner and list the original values underneath as a summary

4. Increase the message line from `truncate` to allow wrapping for better context

## File Changed

- `src/components/SettingsPage.tsx` -- the `NotificationsContent` component (lines 34-136)


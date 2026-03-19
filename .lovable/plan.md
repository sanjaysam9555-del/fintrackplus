

## Add User Name Attribution to Activity Logs

### Problem
Currently, all notification/log entries show what action was taken but not **who** performed it. With multiple users in an organization, it's impossible to tell which person added a transaction, deleted a category, etc.

### Solution
Automatically attach the current user's name to every log entry and display it in the Notifications page.

### Changes

**1. Add `actorName` to Notification type**
`src/lib/types.ts` — Add optional `actorName?: string` field to the `Notification` interface.

**2. Auto-populate actor name in `addNotification`**
`src/lib/store.ts` — In the `addNotification` implementation, automatically set `actorName` from `get().userProfile.name` so every caller gets attribution without code changes. This is a single-line change inside the `addNotification` function.

**3. Display actor name in NotificationsPage**
`src/components/NotificationsPage.tsx` — Show the actor's name below the notification title (e.g., "by Ravi Sharma") in a subtle muted style, right next to the timestamp.

### Technical Details

```typescript
// types.ts: Add to Notification interface
actorName?: string;

// store.ts: Auto-attach in addNotification
addNotification: (notification) => set((state) => ({
  notifications: [{
    ...notification,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    read: false,
    actorName: notification.actorName || get().userProfile.name || 'Unknown',
  }, ...state.notifications].slice(0, 200)
})),

// NotificationsPage.tsx: Show actor name
// After the timestamp line, add:
{notification.actorName && (
  <span> · by {notification.actorName}</span>
)}
```

**Files to modify:**
- `src/lib/types.ts` — Add `actorName` field
- `src/lib/store.ts` — Auto-populate actor name (1 line change)
- `src/components/NotificationsPage.tsx` — Display actor name in UI

No database changes needed — notifications already include all required fields for display.


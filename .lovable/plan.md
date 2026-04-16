
## Problem
On the Settings page (desktop), the third group is currently labeled **"Backup & Branding"** and bundles Backup & Restore, Organisation Branding, and Subscription into one card. The user wants:
1. **Subscription** as its own section.
2. **Backup & Restore** as its own section.
3. **Organisation Branding** as its own section.
4. The two desktop columns to be **parallel in height**.

## Where to change
Only `src/components/SettingsPage.tsx`.

### 1. Split the menu groups
Replace the single `backupItems` group with three separate one-item groups in the `menuItems` builder (around lines 389–416):

```ts
const menuItems = [
  ...(dataItems.length > 0 ? [{ section: "Data Management", items: dataItems }] : []),
  ...(teamItems.length > 0 ? [{ section: "Team & Approvals", items: teamItems }] : []),
  ...(isOwner ? [{ section: "Backup & Restore", items: [backupItem] }] : []),
  ...(isOwner ? [{ section: "Organisation Branding", items: [brandingItem] }] : []),
  ...(isOwner ? [{ section: "Subscription", items: [subscriptionItem] }] : []),
];
```

This automatically renders them as separate cards on both mobile (single column) and desktop (right column, since they're filtered by `section !== "Data Management"`).

### 2. Balance the two desktop columns
Currently the **left column** only holds Data Management while the **right column** stacks Team & Approvals + (now 3) Backup-family sections + Sync + Default Time Frame, making the right column much taller.

Redistribute on desktop (lines 542–636) so heights are visually parallel:

- **Left column**: Data Management + Backup & Restore + Organisation Branding
- **Right column**: Team & Approvals + Subscription + Sync + Default Time Frame

Implement by filtering the desktop column rendering by explicit section names rather than the current `=== "Data Management"` / `!== "Data Management"` split. Mobile stays unchanged (single stacked column in original order).

### 3. Appearance row
Already a 2-col grid with empty right cell — leaves room for the Sign Out button to optionally move there later. No change needed now.

## Files touched
- `src/components/SettingsPage.tsx` (menu builder + desktop column distribution)

## Out of scope
- Mobile layout (already single-column, will naturally show 3 separate cards)
- The actual section sub-pages (BackupRestoreSection, OrgBrandingSection, SubscriptionSection) — already separate components
- Memory update for `mem://style/settings-page-layout-desktop` — will refresh after implementation to reflect the new column distribution



# Fix Dark Mode Contrast Across the App

## Problem

The app uses `bg-primary/10 text-primary` extensively for icon containers, badges, and active states. In dark mode, `--primary` is HSL(214, 78%, 50%) -- a medium blue that lacks contrast against dark surfaces. The same issue affects hardcoded Tailwind colors like `text-blue-500`, `text-purple-500`, and `text-amber-500` which don't brighten for dark mode.

## Strategy

Two-pronged fix:
1. **For `bg-primary/10 text-primary` patterns**: Replace with `bg-accent text-accent-foreground` which is already tuned for dark mode (75% lightness vs 50%)
2. **For hardcoded Tailwind colors**: Add `dark:` variants with lighter shades (e.g., `text-blue-500 dark:text-blue-400`)

## Files and Changes

### 1. `src/components/Dashboard.tsx`
- Date picker buttons: `bg-primary/10 text-primary` to `bg-accent text-accent-foreground`
- Time filter pill: same fix
- Settings grid "Categories" icon: same fix
- "Logs" icon: `text-amber-500` to `text-amber-500 dark:text-amber-400`
- "Reports" icon: `text-purple-500` to `text-purple-500 dark:text-purple-400`

### 2. `src/components/UpcomingRecurringCard.tsx`
- Repeat icon container: `bg-primary/10 text-primary` to `bg-accent text-accent-foreground`

### 3. `src/components/DesktopSidebar.tsx`
- Active nav items: `bg-primary/10 text-primary` to `bg-accent text-accent-foreground`

### 4. `src/components/NotificationPanel.tsx`
- Transaction icon color: `bg-primary/10 text-primary` to `bg-accent text-accent-foreground`
- Bell icon: `text-primary` to `text-accent-foreground`

### 5. `src/components/NotificationsPage.tsx`
- Transaction: `bg-primary/10 text-primary` to `bg-accent text-accent-foreground`
- Purple: add `dark:text-purple-400`
- Blue: add `dark:text-blue-400`
- Emerald: add `dark:text-emerald-400`
- Amber: add `dark:text-amber-400`
- Orange: add `dark:text-orange-400`

### 6. `src/components/SettingsPage.tsx`
- Same icon color fixes as NotificationsPage for the `getIconColor` function
- Badge colors already have dark variants (good)

### 7. `src/components/settings/ReportsSection.tsx`
- Balance stat card: `bg-primary/10` to `bg-accent`
- Custom date buttons: `bg-primary/10 text-primary` to `bg-accent text-accent-foreground`
- CA Package button icon: `text-purple-500` to `text-purple-500 dark:text-purple-400`

### 8. `src/components/AddTransactionSheet.tsx`
- Recurring frequency selected state: `bg-primary/10 text-primary` to `bg-accent text-accent-foreground`

### 9. `src/components/ProjectOverviewPage.tsx`
- Active/Archived tab badge: `bg-primary/10 text-primary` to `bg-accent text-accent-foreground`

### 10. `src/components/PartnerTransferSheet.tsx`
- Header icon, arrow icon: `text-primary` to `text-accent-foreground`

### 11. `src/components/ai-summary/PaymentMethods.tsx`
- Header icon: `text-primary` to `text-accent-foreground`
- Online icon container: `bg-primary/10 text-primary` to `bg-accent text-accent-foreground`

### 12. `src/components/ai-summary/SmartInsights.tsx`
- Amber insight icon: add `dark:text-amber-400` variant

### 13. `src/components/GlobalSearchDialog.tsx`
- Blue payment badge: `text-blue-500` to `text-blue-500 dark:text-blue-400`

## Summary

The core fix is replacing ~40 instances of `text-primary` (50% lightness in dark) with `text-accent-foreground` (75% lightness in dark) and adding `dark:` variants for all hardcoded Tailwind color-500 classes. No new CSS variables needed -- the existing semantic tokens already solve this.

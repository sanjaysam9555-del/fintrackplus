

## Remove Profile Section from Desktop Sidebar

### Problem
The profile section (avatar, name, email) at the top of the desktop sidebar is redundant — the same information is already displayed in the right-side content area with a greeting. It takes up valuable space.

### Fix

**`src/components/DesktopSidebar.tsx`**:
1. **Remove the entire Profile Section** (lines 68–99) — the `div` containing the avatar, name, and email
2. **Move the "Add Transaction" button to the very top** of the sidebar, adding a small top padding to account for safe-area insets
3. Remove the now-unused imports: `userProfile` from `useFinanceStore`, `user` from `useAuth` (keep `signOut` since it's used for logout)

The sidebar will now start directly with the Add Transaction button, followed by Navigation, then Tools, then Collapse/Sign Out at the bottom.

### Files to modify
| File | Change |
|---|---|
| `src/components/DesktopSidebar.tsx` | Remove profile section, move Add Transaction button to top, clean up unused imports |


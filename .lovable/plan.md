

## Enhance Approval Notifications and Animations

### 1. More Prominent "Submitted for Approval" Toast

**`src/components/EditTransactionSheet.tsx`** (line 161) — Replace the plain `toast.success` with a custom styled toast that is more prominent and informative:

```typescript
toast('Sent for Approval', {
  description: 'This entry is handled by another partner. Your changes will apply once they approve.',
  icon: <Clock size={18} className="text-amber-500" />,
  duration: 4000,
  className: 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/30',
});
```

Import `Clock` from lucide-react (already used elsewhere). This gives it an amber/warning visual treatment that stands out from regular success toasts.

Also apply the same treatment to `TransactionDetailSheet.tsx` (delete approval toast) and `PartnersSection.tsx` / `TeamSection.tsx` approval toasts.

### 2. Animated Approval Action on ChangeApprovalPage

**`src/components/settings/ChangeApprovalPage.tsx`** — After approve/reject:

- Instead of immediately refetching (which causes a jarring list jump), animate the card out first:
  - Track a `resolvingId` + `resolvedStatus` state
  - When approved: flash the card border green, show a checkmark overlay, then animate it out (`opacity: 0, height: 0, scale: 0.95`) over ~500ms
  - When rejected: flash red, X overlay, same exit animation
  - After the exit animation completes, refetch the list

- Add `layout` prop to the `motion.div` cards and wrap the list in `AnimatePresence` with `exit` variants so remaining cards smoothly reflow.

### Files to modify

| File | Change |
|---|---|
| `src/components/EditTransactionSheet.tsx` | Prominent amber-styled approval toast with icon and description |
| `src/components/TransactionDetailSheet.tsx` | Same prominent toast for delete approval |
| `src/components/settings/PartnersSection.tsx` | Same prominent toast for partner deletion approval |
| `src/components/settings/TeamSection.tsx` | Same prominent toast for team member removal approval |
| `src/components/settings/ChangeApprovalPage.tsx` | Animated approve/reject with green/red flash, overlay icon, exit animation before refetch |




## Fix Edit Profile Header Behind iOS Status Bar

The `ProfileEditSheet` header uses `sticky top-0` with no safe-area padding, so on iOS standalone (home-screen) apps the close button and "Edit Profile" title sit behind the clock/notch.

### Fix

**`src/components/ProfileEditSheet.tsx`** — Add the `safe-top` utility class to the sticky header div (same pattern used elsewhere in the app for iOS safe-area handling). Change the header from `p-4` to include top safe-area padding:

```tsx
<div className="sticky top-0 bg-background z-10 flex items-center gap-3 p-4 safe-top border-b border-border">
```

This applies the app's existing `safe-top` utility which provides `env(safe-area-inset-top)` padding on standalone iOS PWAs.

### Files to modify
| File | Change |
|---|---|
| `src/components/ProfileEditSheet.tsx` | Add `safe-top` class to sticky header div |


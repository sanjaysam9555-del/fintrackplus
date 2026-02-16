

# Settings Profile Card: Remove Edit Button and Make Card Clickable

## What Changes

The profile card in Settings will be simplified:
1. The "Edit Profile" button at the bottom of the card is removed
2. The card becomes more compact (less padding, reduced spacing)
3. Tapping anywhere on the card opens the Profile Edit sheet (same behavior as the old button)

## Technical Details

**File:** `src/components/SettingsPage.tsx`

- Remove the `<button>` element for "Edit Profile" (around line 403-410)
- Make the outer `motion.div` card clickable by adding `onClick={() => setShowProfileEdit(true)}` and `cursor-pointer`
- Reduce padding from `p-4` to `p-3` and remove the `mt-4` spacing that the button occupied
- Add a subtle chevron indicator on the right side of the profile row to signal it is tappable


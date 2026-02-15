

# Theme Default and Onboarding Theme Picker

## Summary
Three changes: (1) default theme becomes "dark" instead of "system", (2) Auth page and all non-landing pages also respect this default, (3) a new "Choose Display Mode" step is added to the onboarding flow just before the Install step.

## What Changes

### 1. Default theme: dark instead of system
Currently the fallback when no theme is stored is `'system'`. Change it to `'dark'` in three places:
- **`index.html`** inline script: change `var theme = localStorage.getItem('fintrack-theme') || 'system'` to `|| 'dark'`
- **`src/hooks/useTheme.ts`**: change `const mode: ThemeMode = (stored as ThemeMode) || 'system'` to `|| 'dark'`
- **`src/hooks/useTheme.ts`** `getStoredTheme`: same change

This means every new user (and anyone who never explicitly chose a theme) will see dark mode. Users who previously chose light or OLED will keep their choice since it is persisted in localStorage.

### 2. Cloud-sync theme preference to profiles table
Add a `theme` column to the `profiles` table so that when a user logs in on a new device, their preference is restored.

**Database migration:**
```sql
ALTER TABLE public.profiles
  ADD COLUMN theme text NOT NULL DEFAULT 'dark';
```

**`useTheme.ts` changes:**
- On `setTheme`, write the chosen mode to `profiles.theme` (fire-and-forget, already stubbed).
- Export a `loadCloudTheme(userId)` helper that reads `profiles.theme` and applies it if localStorage has no stored value yet.
- In `useSyncEngine` (or `Index.tsx` after auth), call `loadCloudTheme` once on login so returning users get their saved preference.

### 3. Onboarding: "Choose Display Mode" step before Install
Insert a new step between the existing "Stay Notified" step and the "Install the App" step in `OnboardingFlow.tsx`.

**New step UI:**
- Icon: `Monitor` (from lucide-react)
- Title: "Choose Your Look"
- Description: "Pick a display mode that suits your style. You can always change this later in Settings."
- Three tappable cards arranged horizontally:
  - **Light** -- Sun icon, light preview swatch
  - **Dark** -- Moon icon, dark preview swatch (pre-selected)
  - **OLED Black** -- Smartphone icon, pure-black preview swatch
- Tapping a card immediately applies the theme (calls `setTheme` from `useTheme`) so the user sees the change live behind the onboarding overlay.
- The selected mode is persisted to localStorage and cloud (via the updated `setTheme`).

Step order after the change: Welcome -> Transactions -> AI Insights -> Projects -> Notifications -> **Choose Display Mode** -> Install App

### Files Changed

| File | Change |
|------|--------|
| `index.html` | Default theme fallback: `'system'` to `'dark'` |
| `src/hooks/useTheme.ts` | Default fallback to `'dark'`; cloud sync write on setTheme; add `loadCloudTheme` helper |
| `src/components/OnboardingFlow.tsx` | Add "Choose Display Mode" step with interactive theme picker cards |
| `src/pages/Index.tsx` | Call `loadCloudTheme` after auth to restore cloud-saved theme on new devices |
| Database migration | Add `theme` column to `profiles` table |


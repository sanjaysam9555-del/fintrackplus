

# UI/UX Improvements - 6 Fixes

## 1. Partner Avatars (Profile Pictures)

**What changes**: Partners can have profile pictures for easier identification.

**Technical approach**:
- Add `avatar_url` column to the `partners` database table via migration
- Add `avatarUrl` optional field to the `Partner` TypeScript interface
- Update `PartnersSection.tsx` partner form to include a photo upload button (using existing storage bucket pattern from `ProfileEditSheet.tsx`)
- Update `addPartner` and `updatePartner` in `store.ts` to sync `avatar_url`
- Update cloud sync mappings in `useCloudSync.ts` and `syncEngine.ts` to include `avatar_url`
- Create a storage bucket `partner-avatars` via SQL migration with appropriate RLS policies

**Files**: `src/lib/types.ts`, `src/lib/store.ts`, `src/hooks/useCloudSync.ts`, `src/lib/syncEngine.ts`, `src/components/settings/PartnersSection.tsx`, + DB migration

---

## 2. Mobile Font Size Optimization for Transaction Entries

**What changes**: Transaction items on mobile show smaller, denser text to maximize information at a glance.

**Technical approach**:
- In `TransactionItem.tsx`, reduce the non-compact title from `font-semibold` (inherits base ~16px) to `text-sm font-semibold` on mobile
- Reduce subtitle text from `text-sm` to `text-xs`
- Reduce amount text size slightly
- These changes are mobile-only; desktop sizes remain unchanged

**File**: `src/components/TransactionItem.tsx`

---

## 3. Partner Avatar/Monogram on All Transaction Entries

**What changes**: Every transaction item across all tabs shows the partner's avatar image or colored monogram circle for quick identification.

**Technical approach**:
- In `TransactionItem.tsx`, move the partner badge from inside the subtitle text into a visible position in the main row (next to the category icon or amount area)
- If the partner has an `avatarUrl`, show a small circular image; otherwise show the existing colored monogram
- Make it slightly larger (w-5 h-5 instead of w-4 h-4) for better visibility
- This applies everywhere `TransactionItem` is rendered (Home, Expenses, Income, Project details, etc.)

**File**: `src/components/TransactionItem.tsx`

---

## 4. Theme Not Applied on Initial Load

**What changes**: The app correctly applies dark/OLED theme immediately on load, not just when Settings is visited.

**Root cause**: The `useTheme` hook is only called inside `SettingsPage.tsx`. The theme is applied on mount via `useEffect`, but this component is lazy-loaded and only mounts when the user visits Settings.

**Technical approach**:
- Apply the stored theme at the top level before React renders. Add a synchronous script in `index.html` (inline `<script>`) that reads `localStorage('fintrack-theme')` and applies the correct class to `<html>` immediately. This prevents any flash of light mode.
- Additionally, call `useTheme()` in `Index.tsx` (the main authenticated page) so that theme changes and system preference listeners are active app-wide, not just in Settings.

**Files**: `index.html`, `src/pages/Index.tsx`

---

## 5. Smooth Scrolling Fixes

**What changes**: Vertical scrolling across the app feels smooth and doesn't get stuck.

**Technical approach**:
- The main scroll container in `Index.tsx` uses `overflow-y-auto overscroll-contain scroll-smooth`. The `scroll-smooth` class causes programmatic scrolling to be smooth but can interfere with touch scrolling on some mobile browsers. Remove `scroll-smooth` from the scroll container.
- Add `-webkit-overflow-scrolling: touch` for iOS momentum scrolling
- Ensure the `AnimatePresence` exit animations don't cause layout shifts that block scroll by adding `overflow-hidden` to the motion wrapper only during transitions
- Add `overscroll-behavior-y: contain` to prevent scroll chaining

**File**: `src/pages/Index.tsx`, `src/index.css`

---

## 6. Summary Card Compact Number Formatting

**What changes**: Large numbers on summary cards show as "35.7L" instead of "35,70,084" on mobile. The animated counter still works with these compact numbers.

**Technical approach**:
- Create a `formatCompactCurrency` function that formats amounts as:
  - Under 1,000: show full number (e.g., "850")
  - 1K-99.9K: show with K suffix (e.g., "35.7K")  
  - 1L+: show with L suffix (e.g., "35.7L")
  - 1Cr+: show with Cr suffix (e.g., "1.2Cr")
- In `SummaryCard.tsx`, use this compact format on mobile (`lg:` breakpoint uses full format)
- Update the `AnimatedNumber` component to accept a formatter function so the spring animation works with compact display

**Files**: `src/lib/constants.ts`, `src/components/SummaryCard.tsx`

---

## Summary of All File Changes

| File | Changes |
|------|---------|
| DB Migration | Add `avatar_url` column to `partners`, create `partner-avatars` storage bucket |
| `src/lib/types.ts` | Add `avatarUrl?: string` to `Partner` interface |
| `src/lib/store.ts` | Sync `avatar_url` in addPartner/updatePartner |
| `src/hooks/useCloudSync.ts` | Map `avatar_url` in partner cloud sync |
| `src/lib/syncEngine.ts` | Map `avatar_url` in partner sync engine |
| `src/components/settings/PartnersSection.tsx` | Add avatar upload to partner form, show avatar in list |
| `src/components/TransactionItem.tsx` | Smaller mobile fonts, visible partner avatar/monogram |
| `index.html` | Inline script to apply theme before React loads |
| `src/pages/Index.tsx` | Call `useTheme()` at top level, fix scroll container classes |
| `src/index.css` | Add `-webkit-overflow-scrolling: touch` styles |
| `src/lib/constants.ts` | Add `formatCompactCurrency` function |
| `src/components/SummaryCard.tsx` | Use compact format on mobile with animated counter |


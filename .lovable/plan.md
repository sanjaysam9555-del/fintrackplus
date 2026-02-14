

# Landing Page: Force Dark Mode + Add Login Button

## 1. Force Dark Mode on Landing Page

The landing page will always render in dark mode regardless of the user's theme preference. This will be done by wrapping the landing page in a component that forces the `dark` class on mount and restores the user's original theme on unmount.

**In `src/pages/Landing.tsx`:**
- On mount: save current theme classes, apply `dark` class to `<html>`, remove `light`/`oled`
- On unmount: restore the original theme classes so the rest of the app is unaffected

## 2. Add "Login" Button to Header

Add a secondary "Login" button next to the existing "Get Started" CTA in both desktop and mobile nav. This provides a clear path for returning users.

**In `src/components/landing/LandingHeader.tsx`:**
- Desktop: Add a ghost/outline "Login" button before the "Get Started" button
- Mobile: Add the same "Login" button in the mobile dropdown menu
- Both navigate to `/auth`

## Technical Details

### Files Modified

1. **`src/pages/Landing.tsx`**
   - Add a `useEffect` that forces `document.documentElement` to have the `dark` class
   - On cleanup, restore original classes (`light`, `dark`, `oled`)

2. **`src/components/landing/LandingHeader.tsx`**
   - Add a `LogIn` icon import from lucide-react
   - Desktop nav: Add a `variant="ghost"` Button labeled "Login" before the "Get Started" button
   - Mobile dropdown: Add matching "Login" button before "Get Started"
   - Both buttons call `navigate("/auth")`


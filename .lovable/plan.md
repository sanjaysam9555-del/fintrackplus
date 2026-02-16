

# Fix: PWA Opens Landing Page Instead of Dashboard

## Root Cause

Two issues are combining to cause this problem:

1. The `manifest.json` file sets `start_url: "/"` -- so when someone opens the app from their home screen, it always navigates to the root URL `/`
2. On the production domain (`fintrackplus.com`), the route `/*` is a catch-all that renders the Landing page -- so the app always shows the marketing page first

## Solution

### 1. Update `manifest.json` start URL

Change `start_url` from `/` to `/application` so the PWA launches directly into the app area instead of the landing page.

### 2. Smart catch-all route in `App.tsx`

Update the catch-all route on the landing domain so that when the app is running in **standalone/PWA mode** (i.e., launched from home screen), it redirects to `/application` (which shows dashboard or login) instead of showing the landing page.

### 3. Add PWA detection utility in `domainUtils.ts`

Add a helper function to detect if the app is running as an installed PWA (standalone mode), using `window.matchMedia('(display-mode: standalone)')`.

## Technical Details

**`public/manifest.json`**
- Change `"start_url": "/"` to `"start_url": "/application"`

**`src/lib/domainUtils.ts`**
- Add `isPWA()` helper that checks `display-mode: standalone` or `navigator.standalone` (iOS Safari)

**`src/App.tsx`**
- In the landing domain route block, change the catch-all from always rendering `<Landing />` to:
  - If running as PWA (standalone mode): `<Navigate to="/application" replace />`
  - Otherwise: `<Landing />`

## Files Modified
1. `public/manifest.json` -- update start_url
2. `src/lib/domainUtils.ts` -- add isPWA() helper
3. `src/App.tsx` -- smart catch-all with PWA detection


# Subdomain Routing for fintrackplus.com

## Overview
Route users based on which domain they visit:
- **fintrackplus.com** and **www.fintrackplus.com** → Landing page (marketing site)
- **app.fintrackplus.com** → App (login/dashboard)

## How It Works
The app checks `window.location.hostname` at the top of the routing logic:
- If hostname is `app.fintrackplus.com` → show the app (auth/dashboard, same as today)
- If hostname is `fintrackplus.com` or `www.fintrackplus.com` → show the landing page
- For the Lovable preview domain (`*.lovable.app`) → keep current behavior (both `/landing` and `/` work as-is)

## Changes Required

### 1. Update `src/App.tsx` (AppRoutes component)
- Add a hostname check at the top of the routing logic
- If on the root/www domain, render the Landing page directly at `/` (instead of requiring `/landing`)
- If on the `app.` subdomain or preview domain, keep current routing unchanged
- The `/landing` route stays available on all domains as a fallback

### 2. Update Landing Page CTAs (`src/components/landing/LandingHeader.tsx` + other landing components)
- Update "Get Started" and "Login" button links to navigate to `app.fintrackplus.com` instead of `/auth`
- Use a helper function that returns the correct URL based on environment:
  - On production: `https://app.fintrackplus.com`
  - On preview/localhost: `/auth` (relative, same domain)

---

## Technical Details

### Domain detection helper (added in App.tsx)
```typescript
const isLandingDomain = () => {
  const host = window.location.hostname;
  return host === 'fintrackplus.com' || host === 'www.fintrackplus.com';
};

const isAppDomain = () => {
  const host = window.location.hostname;
  return host === 'app.fintrackplus.com';
};
```

### App URL helper (for landing page links)
```typescript
const getAppUrl = () => {
  const host = window.location.hostname;
  if (host === 'fintrackplus.com' || host === 'www.fintrackplus.com') {
    return 'https://app.fintrackplus.com';
  }
  return '/auth'; // preview/localhost fallback
};
```

### Routing logic change in AppRoutes
- When `isLandingDomain()` is true: render Landing at `/` and redirect all other paths to `/`
- When `isAppDomain()` or on preview domain: keep existing auth/dashboard routing unchanged

### Files to modify
1. **src/App.tsx** — Add domain detection, conditional routing
2. **src/components/landing/LandingHeader.tsx** — Update CTA hrefs to use `getAppUrl()`
3. **src/components/landing/HeroSection.tsx** — Update CTA links
4. **src/components/landing/FloatingMobileCTA.tsx** — Update CTA link
5. **src/components/landing/PricingSection.tsx** — Update CTA links

## Next Steps
Once you confirm all 3 domains are showing as **Active** in Settings → Domains, approve this plan and I'll implement everything.

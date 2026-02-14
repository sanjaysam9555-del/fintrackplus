

# Fix: Login and Get Started CTA 404 Error

## Root Cause

When a user clicks "Login" or "Get Started" on the landing page, `getAppUrl()` is called:
- On `fintrackplus.com`: returns `https://app.fintrackplus.com/auth` (full redirect -- works correctly)
- On any other domain (preview, `app.fintrackplus.com`): returns `/auth` and uses React Router's `navigate('/auth')`

The problem is there is **no explicit `/auth` route** in `App.tsx`. For logged-out users, the catch-all `*` renders AuthPage (which happens to work). But for **logged-in users**, the catch-all `*` renders **NotFound** -- hence the 404.

This also means if a logged-in user visits `/landing` on the app domain and clicks "Get Started", they get a 404 instead of being redirected to the dashboard.

## Fix (2 changes)

### 1. Add an explicit `/auth` route in `App.tsx`

Add a `/auth` route that:
- For logged-out users: shows the Auth page (explicit, not relying on catch-all)
- For logged-in users: redirects to `/` (the dashboard)

This ensures `/auth` never 404s regardless of authentication state.

**File:** `src/App.tsx`

Add before the catch-all routes:
```tsx
<Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
```

Import `Navigate` from `react-router-dom`.

### 2. No changes needed to CTA components

The `LandingFooter.tsx`, `LandingHeader.tsx`, and `FloatingMobileCTA.tsx` all already correctly use `getAppUrl()`. The bug was never in the CTA buttons -- it was in the missing route.

## Summary

| File | Change |
|---|---|
| `src/App.tsx` | Add explicit `/auth` route with redirect for logged-in users; import `Navigate` |

One small, targeted fix.



# Fix Remaining Domain Routing Issues

Two issues found during the flow review that need fixing before everything is production-ready.

## Issue 1: PWA manifest start_url

**File: `public/manifest.json`**

The `start_url` is still set to `/application`, which was the old path prefix. Since PWA users will now install from `app.fintrackplus.com`, the start URL should be `/` (the root of the app subdomain).

Change `"start_url": "/application"` to `"start_url": "/"`.

## Issue 2: Password reset redirect URL is broken on landing domain

**File: `src/hooks/useAuth.tsx`** (line 68)

Current code:
```
redirectTo: `${window.location.origin}${appPath('/reset-password')}`
```

When a user triggers "Forgot Password" from the landing domain (`fintrackplus.com`):
- `window.location.origin` = `https://fintrackplus.com`
- `appPath('/reset-password')` = `https://app.fintrackplus.com/reset-password` (absolute URL)
- Result: `https://fintrackplus.comhttps://app.fintrackplus.com/reset-password` (broken!)

**Fix:** The reset password redirect should always point to `app.fintrackplus.com`. Use a helper that returns a full absolute URL correctly:

```typescript
// If on landing domain, redirect to app subdomain
// If on app domain or dev, use current origin
const resetUrl = isLandingDomain()
  ? `https://app.fintrackplus.com/reset-password`
  : `${window.location.origin}/reset-password`;
```

This also applies to the `emailRedirectTo` in `signUp` (line 47), which uses `window.location.origin`. For sign-up email verification links clicked from `fintrackplus.com`, users would land back on the landing page rather than the app. This should also point to `app.fintrackplus.com` when on the landing domain.

## Summary of Changes

| File | Change |
|------|--------|
| `public/manifest.json` | Update `start_url` from `/application` to `/` |
| `src/hooks/useAuth.tsx` | Fix `resetPassword` redirect URL to avoid double-origin on landing domain |
| `src/hooks/useAuth.tsx` | Fix `signUp` emailRedirectTo to point to app subdomain when on landing domain |

## Technical Detail

The root cause is that `appPath()` returns an **absolute URL** (`https://app.fintrackplus.com/...`) when on the landing domain, but the auth code prepends `window.location.origin` to it, creating a malformed double-URL. The fix is to use `appPath()` directly (since it already returns a full URL on landing domain) or use conditional logic with `isLandingDomain()`.


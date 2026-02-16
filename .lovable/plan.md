
# Fix All CTA and Auth Redirects Using Path-Based Routing

## The Problem

Lovable's hosting redirects all non-primary custom domains to the primary domain (`fintrackplus.com`) at the server level, before any client-side code executes. This means `app.fintrackplus.com` will always bounce users back to `fintrackplus.com` -- no amount of JavaScript can fix a server-level redirect.

This is why `/application/` path-based routing was working before and the subdomain approach is not.

## The Solution

Revert all links and redirects to use the path-based approach that was already working:

- Landing page: `fintrackplus.com` (root `/`)
- App/Auth: `fintrackplus.com/application/auth`
- Get Started: `fintrackplus.com/application/auth?mode=signup`
- Existing User: `fintrackplus.com/application/auth?mode=login`

## Changes

### 1. `src/lib/domainUtils.ts`

Revert `appPath()` to return `/application` paths instead of `https://app.fintrackplus.com`:

```
Before:  return `https://app.fintrackplus.com${cleanPath}`;
After:   return `/application${cleanPath}`;
```

This fixes every CTA button (Get Started, Existing User, floating mobile CTA, final CTA) since they all call `getAppUrl()` which calls `appPath()`.

### 2. `src/hooks/useAuth.tsx`

Update `getAuthRedirectUrl` to use the same path-based approach:

- On landing domain: `https://fintrackplus.com/application{path}`
- On preview/dev: `{origin}{path}`

This fixes email verification links and password reset links sent via email.

### 3. `public/manifest.json`

Revert `start_url` from `/` back to `/application` so PWA installs launch into the app dashboard.

### 4. Manual step: Remove `app.fintrackplus.com` from domain settings

Since the subdomain just redirects to the primary domain, it serves no purpose. Go to **Settings -> Domains** and remove `app.fintrackplus.com`. Keep `fintrackplus.com` and `www.fintrackplus.com`.

## What the user experience will be

- Visit `fintrackplus.com` or `www.fintrackplus.com` -- sees the landing page
- Click "Get Started" -- navigates to `fintrackplus.com/application/auth?mode=signup`
- Click "Existing User" -- navigates to `fintrackplus.com/application/auth?mode=login`
- Email verification link -- opens `fintrackplus.com/application/`
- Password reset link -- opens `fintrackplus.com/application/reset-password`
- PWA install -- launches at `fintrackplus.com/application/`

## Why not subdomains?

A true subdomain setup (`app.fintrackplus.com`) would require a **second, separate Lovable project** for the app. That is a significant architectural change (splitting code, duplicating shared components, managing two deployments). The path-based approach gives the exact same user experience within a single project and is already proven to work.

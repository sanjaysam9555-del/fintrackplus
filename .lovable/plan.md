

# Fix: Support /application/ routes on all domains

## Problem
The `/application/` routes (like `/application/auth`) only work on `fintrackplus.com` because they're inside the `isLandingDomain()` block. On the preview/dev domain, navigating to `/application/auth` shows a 404 since those routes don't exist there.

## Solution
Add the `/application/*` routes to the non-landing domain block as well, so the app works consistently regardless of domain. This way:
- `fintrackplus.com/application/auth` works
- `preview-domain.lovable.app/application/auth` also works
- `preview-domain.lovable.app/auth` continues to work as before

## Changes

### 1. `src/App.tsx` -- Add /application/ routes to the non-landing block
Add duplicate route entries for `/application/auth`, `/application/reset-password`, `/application/install`, and `/application` in the non-landing domain route block (lines 152-172). This ensures the same paths work on both domains.

The routes will mirror the existing ones:
- `/application/install` renders InstallPage
- `/application/reset-password` renders ResetPasswordPage
- `/application/auth` renders AuthPage (or redirects if logged in)
- `/application` renders Index (if logged in) or AuthPage

### 2. No other files need changes
The `appPath()` helper already returns unprefixed paths on non-landing domains, so all internal navigation continues to work. This change just ensures that if someone directly visits an `/application/` URL on the preview domain, it doesn't 404.

## Summary
One file changed (`App.tsx`), adding ~10 lines of route definitions to the non-landing block.


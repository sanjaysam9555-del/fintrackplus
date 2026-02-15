

# Move App to `fintrackplus.com/application/`

## Why This Works
Since `fintrackplus.com` is already verified and active in Lovable, serving the app under `/application/` on the same domain requires zero DNS changes. No subdomain verification needed.

## How It Works

```text
fintrackplus.com/              --> Landing page (visitors)
fintrackplus.com/application/  --> Dashboard (logged-in users) or Auth page
fintrackplus.com/application/auth  --> Login / Signup
fintrackplus.com/application/reset-password  --> Password reset
fintrackplus.com/privacy       --> Privacy policy
fintrackplus.com/terms         --> Terms page
```

On the preview/dev domain, everything stays as-is (no `/application` prefix). The prefix only applies on `fintrackplus.com`.

## What Changes

### 1. `src/lib/domainUtils.ts` -- Add path helper
- `getAppUrl('/auth')` will return `/application/auth` (on fintrackplus.com) instead of a cross-domain URL
- Add a new `appPath()` helper that prefixes paths with `/application` only on the landing domain
- Remove `isAppDomain()` (no longer needed)

### 2. `src/App.tsx` -- Add `/application/*` routes on landing domain
Currently the landing domain block only serves landing/privacy/terms. We add the full app routes under `/application/*`:
- `/application` -- Dashboard (authenticated) or redirect to auth
- `/application/auth` -- Login/Signup page
- `/application/reset-password` -- Password reset
- `/application/install` -- Install page

### 3. `src/hooks/useAuth.tsx` -- Fix password reset redirect
The reset password email redirect URL (`window.location.origin/reset-password`) needs to use `/application/reset-password` when on the landing domain.

### 4. Internal navigation updates (3 files)
Several components use `navigate('/')` or `navigate('/?tab=settings')` to go back to the dashboard. These need to use the `appPath()` helper to work correctly on `fintrackplus.com`:

- `src/components/AddTransactionSheet.tsx` -- 6 instances of `navigate('/?tab=settings')`
- `src/components/EditTransactionSheet.tsx` -- 6 instances of `navigate('/?tab=settings')`
- `src/pages/Install.tsx` -- 2 instances of `navigate('/')`

### 5. `src/pages/Privacy.tsx` -- Update URL mention
Change "app.fintrackplus.com" text reference to "fintrackplus.com/application".

### 6. DNS Cleanup
- Remove `use.fintrackplus.com` and `app.fintrackplus.com` from Lovable domain settings
- Remove the corresponding A records and TXT records from GoDaddy
- Keep only `fintrackplus.com` and `www.fintrackplus.com`

## Summary

| Area | Change |
|------|--------|
| `domainUtils.ts` | New `appPath()` helper; update `getAppUrl()` to use `/application` prefix |
| `App.tsx` | Add `/application/*` routes inside the landing domain block |
| `useAuth.tsx` | Prefix reset-password redirect with `appPath()` |
| `AddTransactionSheet.tsx` | Use `appPath('/?tab=settings')` for navigation |
| `EditTransactionSheet.tsx` | Use `appPath('/?tab=settings')` for navigation |
| `Install.tsx` | Use `appPath('/')` for navigation |
| `Privacy.tsx` | Update text reference |
| GoDaddy + Lovable | Remove subdomain entries, keep root + www only |

Total: 7 files modified, all small targeted changes.


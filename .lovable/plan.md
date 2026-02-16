

# Route CTAs to app.fintrackplus.com

Now that `app.fintrackplus.com` is live as the dedicated app subdomain, we need to update the domain routing so all "Get Started" / "Existing User" links on the landing page point to `https://app.fintrackplus.com` instead of the current `/application/*` path prefix.

## What changes

### 1. Update `src/lib/domainUtils.ts`

The core routing utility. Currently `getAppUrl()` returns `/application/auth` on the landing domain. Update it to return `https://app.fintrackplus.com/auth` instead.

- Add `app.fintrackplus.com` to the domain detection (it should NOT be treated as a landing domain)
- Update `getAppUrl()` to return absolute URLs pointing to `app.fintrackplus.com` when on the landing domain
- `appPath()` used by in-app navigation (settings, install page) should also route to the app subdomain when on the landing domain

### 2. Update `src/App.tsx` routing

- Add `app.fintrackplus.com` as an "app domain" -- when the user is on this subdomain, serve the app routes directly (no `/application` prefix needed)
- Keep `/application/*` routes for backward compatibility (existing bookmarks, PWA installs)
- On `fintrackplus.com`, the landing page still serves as the root, but CTAs now link out to the subdomain

### 3. Files using `getAppUrl()` (no changes needed)

These files all use the pattern `const url = getAppUrl(); url.startsWith('http') ? window.location.href = url : navigate(url);` which already handles absolute URLs correctly via `window.location.href`:

- `LandingHeader.tsx` -- Get Started and Existing User links
- `HeroSection.tsx` -- main CTA button
- `PricingSection.tsx` -- Get Started button
- `LandingFooter.tsx` -- Final CTA button
- `FloatingMobileCTA.tsx` -- floating mobile button

Since these already check for `http` and use `window.location.href` for absolute URLs, they will automatically work once `getAppUrl()` returns `https://app.fintrackplus.com/...`.

## Technical Details

```text
Before:
  fintrackplus.com  -->  Landing (/) + App (/application/*)
  getAppUrl('/auth') --> "/application/auth"

After:
  fintrackplus.com      -->  Landing page only
  app.fintrackplus.com  -->  App (/, /auth, /install, etc.)
  getAppUrl('/auth')    --> "https://app.fintrackplus.com/auth"
```

### Key changes in `domainUtils.ts`:

- `isLandingDomain()`: stays the same (fintrackplus.com / www)
- New `isAppDomain()`: detects `app.fintrackplus.com`
- `getAppUrl()`: returns `https://app.fintrackplus.com{path}` when on landing domain
- `appPath()`: same behavior -- returns absolute app subdomain URL when on landing domain

### Key changes in `App.tsx`:

- Add `isAppDomain()` check: when on `app.fintrackplus.com`, serve standard app routes (same as the current non-landing-domain branch)
- Keep existing `isLandingDomain()` branch but the `/application/*` routes remain for backward compatibility

## Files Changed
- `src/lib/domainUtils.ts` -- update URL generation to point to app subdomain
- `src/App.tsx` -- add app subdomain routing branch

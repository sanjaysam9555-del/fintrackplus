

# Fix: Password Reset Emails Not Being Sent

## Root Cause

The `resetPasswordForEmail` call includes a `redirectTo` URL, but the authentication system requires redirect URLs to be explicitly whitelisted. Currently, none of the app's URLs (preview, published, or custom domain) are configured as allowed redirect URLs, so the reset email is silently not sent.

Additionally, the client-side code doesn't surface errors clearly when the API call fails -- if the call returns an error, the toast shows it, but if the call "succeeds" without actually sending an email (due to redirect URL restrictions), the user sees the "Email Sent" confirmation screen with no email arriving.

## Changes

### 1. Configure Allowed Redirect URLs

Use the Lovable Cloud auth configuration tool to add the following redirect URLs to the allowed list:

- `https://bright-balance-beam.lovable.app/reset-password` (published domain)
- `https://id-preview--79a3e63b-a41d-4b9c-bf1d-9935381d7325.lovable.app/reset-password` (preview domain)
- `https://fintrackplus.com/application/reset-password` (custom domain, landing)
- `https://app.fintrackplus.com/reset-password` (custom domain, app subdomain)

Also set the Site URL to the published domain so the auth system has a proper base URL.

### 2. Improve Error Handling in `src/pages/Auth.tsx`

In the `ForgotPasswordScreen` component, add a console log when the reset is triggered so we can trace issues in the future. Also add a small note below the success screen telling users to check their spam folder, to cover cases where the email lands in spam.

### 3. Verify the Fix

After configuring the redirect URLs, test the password reset flow end-to-end by triggering a reset from the preview domain and confirming the email arrives.

## Technical Details

- Only one file needs code changes: `src/pages/Auth.tsx` (minor improvement to the forgot password UX)
- The main fix is a backend configuration change to whitelist redirect URLs
- No new dependencies or files required


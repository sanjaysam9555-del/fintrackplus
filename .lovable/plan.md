
# Fix: Branded Password Reset Emails

## Problem
The `[auth.hook.send_email]` config in `config.toml` is ignored by Lovable Cloud -- it uses its own internal email proxy. So your branded Edge Function never gets called, and users receive the default unbranded email.

## Solution
Call the `send-email` Edge Function **directly from your app** instead of relying on the auth hook. The function will use the Admin API to generate a secure password reset link, then send the branded email via Resend.

This means the default `supabase.auth.resetPasswordForEmail()` is no longer used for password reset -- your Edge Function handles everything.

## Changes

### 1. Update `supabase/functions/send-email/index.ts`
- Accept a direct request: `{ email, type: "recovery", redirectTo: "..." }`
- Use `SUPABASE_SERVICE_ROLE_KEY` (already available) to create a Supabase Admin client
- Call `supabase.auth.admin.generateLink({ type: "recovery", email })` to get a secure reset link
- Send the branded email with that link via Resend
- Keep the existing email template and branding intact

### 2. Update `src/hooks/useAuth.tsx`
- Change `resetPassword()` to call the Edge Function directly instead of `supabase.auth.resetPasswordForEmail()`
- Use `supabase.functions.invoke('send-email', { body: { email, type: 'recovery', redirectTo } })`

### 3. Clean up `supabase/config.toml`
- Remove the `[auth.hook.send_email]` section since it doesn't work on Lovable Cloud

## What stays the same
- The branded email template (logo, gradient header, Saffron Events footer) -- already built
- The password reset page at `/reset-password` -- already works
- The Resend API key -- already configured
- The user experience on the Auth page -- identical flow

## Technical Detail
The `SUPABASE_SERVICE_ROLE_KEY` secret is already available in Edge Functions. The `admin.generateLink()` API returns a proper action link that, when clicked, logs the user in with a recovery session -- exactly like the default flow, but with your branded email.

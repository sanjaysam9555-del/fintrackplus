

# Branded Auth Emails via Resend

## Overview
Create a backend function that intercepts all authentication emails (password reset, email verification, magic links) and sends them through Resend with FinTrack+ branding -- your logo, app name, and sent from your own domain.

## What Changes

### 1. Store the Resend API Key
Your API key will be securely stored as a backend secret (`RESEND_API_KEY`) so the email function can use it.

### 2. Create the Email Sending Function
A new backend function (`send-email`) will handle all auth-related emails. When the authentication system needs to send an email (password reset, signup verification, etc.), it will call this function instead of the default email provider.

The function will:
- Receive the email event (reset, signup, invite, etc.)
- Build a professionally branded HTML email with:
  - FinTrack+ logo (from your app icon)
  - "FinTrack+" brand name in the header
  - Clean, modern email template with your brand colors
  - Proper footer with "Saffron Events" attribution
- Send it via Resend from `no-reply@fintrackplus.com`

### 3. Configure the Auth Email Hook
Update the backend configuration so the authentication system routes all emails through your new function instead of the default sender.

## Email Template Design

```text
+----------------------------------+
|        [FinTrack+ Logo]          |
|          FinTrack+               |
|----------------------------------|
|                                  |
|   Hi [Name],                     |
|                                  |
|   [Context message based on      |
|    email type]                   |
|                                  |
|   [ Click Here to Reset ]        |
|                                  |
|   If you didn't request this,    |
|   you can safely ignore it.      |
|                                  |
|----------------------------------|
|   An app by Saffron Events       |
|   fintrackplus.com               |
+----------------------------------+
```

Supported email types:
- **Password Reset** -- "Reset Your Password"
- **Email Verification (Signup)** -- "Verify Your Email"
- **Magic Link** -- "Your Login Link"
- **Email Change** -- "Confirm Email Change"
- **Reauthentication** -- "Confirm Your Identity"

## Sender Details
- **From**: `FinTrack+ <no-reply@fintrackplus.com>`
- **Reply-to**: none (no-reply address)

## Technical Details

### Files created
- `supabase/functions/send-email/index.ts` -- Edge function that receives auth webhook events, builds branded HTML, and sends via Resend API

### Files modified
- `supabase/config.toml` -- Add `[auth.hook.send_email]` configuration pointing to the new function, with `verify_jwt = false` for the function

### Secrets added
- `RESEND_API_KEY` -- Your Resend API key for sending emails

### How it works
1. User triggers a password reset (or signup, etc.)
2. The auth system fires a webhook to the `send-email` function
3. The function validates the webhook, builds a branded HTML email
4. Resend sends the email from `no-reply@fintrackplus.com`
5. User receives a professionally branded email with the correct action link




# Launch-Ready Fixes (Non-Stripe Items)

## Overview
Four changes to close the remaining gaps before launch, excluding payment integration.

---

## 1. Fix FinalCTA Domain Redirect (Bug Fix)

**Problem:** The "Get Started" button in the footer's FinalCTA component uses `navigate("/auth")`, which breaks on `fintrackplus.com` (tries to load `/auth` on the landing domain instead of redirecting to `app.fintrackplus.com`).

**Fix:** Import `getAppUrl` from `domainUtils` and use the same redirect pattern as other landing CTAs.

**File:** `src/components/landing/LandingFooter.tsx`

---

## 2. Forgot Password Flow

**Problem:** No way for users to recover their account if they forget their password.

**What gets built:**

- A "Forgot password?" link below the password field on the login form
- When clicked, the form switches to a "Reset Password" view where users enter their email
- Calls the backend's `resetPasswordForEmail` method, which sends a password reset link
- A new `/reset-password` page that handles the reset link callback -- user enters a new password and submits
- The `useAuth` hook gets two new methods: `resetPassword(email)` and `updatePassword(newPassword)`

**Files changed:**
- `src/hooks/useAuth.tsx` -- add `resetPassword` and `updatePassword` methods
- `src/pages/Auth.tsx` -- add forgot password link + reset email form view
- `src/pages/ResetPassword.tsx` -- new page for setting a new password after clicking the email link
- `src/App.tsx` -- add `/reset-password` route (public, accessible without login)

---

## 3. Email Verification UX

**Problem:** After signup, users just see a toast "Account created successfully!" with no guidance about checking their email. They might not realize they need to verify.

**What gets built:**

- After a successful signup, instead of staying on the form, the Auth page switches to a "Check Your Email" screen
- This screen shows:
  - A mail icon
  - The email address they signed up with
  - Instructions: "We've sent a verification link to your email. Check your inbox (and spam folder)."
  - A "Resend verification email" button (with cooldown timer)
  - A "Back to login" link
- This replaces the toast-only feedback with a clear, guided experience

**File:** `src/pages/Auth.tsx` -- add a `showVerification` state and a verification screen component within the same file

---

## 4. Privacy Policy and Terms of Service Pages

**Problem:** The footer links to `/privacy` and `/terms` but those pages don't exist (404). These are legally required before collecting payments.

**What gets built:**

- **`src/pages/Privacy.tsx`** -- Privacy Policy page covering: data collected, how it's stored/used, third-party services, cookies, user rights, contact info. Tailored for an Indian SaaS product.
- **`src/pages/Terms.tsx`** -- Terms of Service page covering: subscription terms, acceptable use, cancellation/refund policy, liability limits, governing law (India). References the 30-day money-back guarantee shown on the pricing section.
- Both pages use a clean, readable layout consistent with the app's design (card-based, max-width container, proper typography)
- Routes added in `src/App.tsx` -- accessible on both the landing domain and app domain (public routes, no auth required)

**Files created:**
- `src/pages/Privacy.tsx`
- `src/pages/Terms.tsx`

**Files changed:**
- `src/App.tsx` -- add `/privacy` and `/terms` routes to both the landing domain routes and the app domain routes

---

## Summary of All File Changes

| File | Action | What |
|---|---|---|
| `src/components/landing/LandingFooter.tsx` | Edit | Fix FinalCTA to use `getAppUrl()` |
| `src/hooks/useAuth.tsx` | Edit | Add `resetPassword` + `updatePassword` methods |
| `src/pages/Auth.tsx` | Edit | Add forgot password link, reset email form, email verification screen |
| `src/pages/ResetPassword.tsx` | Create | New password update page (from reset email link) |
| `src/pages/Privacy.tsx` | Create | Privacy Policy page |
| `src/pages/Terms.tsx` | Create | Terms of Service page |
| `src/App.tsx` | Edit | Add routes for `/reset-password`, `/privacy`, `/terms` |

## Implementation Order
1. FinalCTA bug fix (quick win, 1 file)
2. Auth hook updates (adds reset methods)
3. Forgot password + email verification UX (Auth page rewrite)
4. Reset password page (new file)
5. Privacy and Terms pages (new files)
6. App.tsx routing updates (ties it all together)


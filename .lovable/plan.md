
Problem is likely not the complimentary-access check anymore. The stronger signal is this:

- You are currently ending up on `/billing`
- Session replay shows login succeeds, then Billing renders with “Subscription active” and “Go to App”
- In `App.tsx`, when logged out, protected routes render `<AuthPage />` directly instead of redirecting to `/auth`

That means if the current URL is `/billing` while logged out, you see the login form there. After sign-in, the URL is still `/billing`, so the app simply renders the Billing page again.

Plan:
1. Fix unauthenticated routing in `src/App.tsx`
   - Replace the logged-out fallbacks that render `<AuthPage />` on protected paths with redirects to the explicit auth route instead:
   - app domain: `* -> /auth`
   - landing domain app routes: `/application/* -> /application/auth`
   - default routing: protected paths should redirect to the matching auth route, not render auth in place

2. Add a defensive post-login redirect in `src/pages/Auth.tsx`
   - After successful sign-in, navigate to the app root (`appPath("/")`) so login always lands on dashboard even if the auth screen was reached from a protected URL

3. Keep billing accessible only when intentionally opened
   - No auto-bounce out of Billing for valid active users, so Settings → Subscription still works normally
   - Only fix the accidental “login happened on /billing” case

4. Verify related flows
   - Check both `/auth` and `/application/auth`
   - Check login from a stale `/billing` URL
   - Check complimentary-access login specifically
   - Confirm mobile and desktop behavior remain correct

Files to update:
- `src/App.tsx`
- `src/pages/Auth.tsx`

Expected result:
- If you sign in from a stale `/billing` URL, you’ll be taken to the dashboard instead of staying on Billing
- Billing will only appear when you explicitly open it from inside the app

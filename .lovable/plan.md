
## Goal
Expand the mandatory onboarding tour to showcase 4 more significant features, remove the skip option entirely, and end with a dedicated "Activate Trial" card that clearly states pricing/duration/mandate details and routes to billing.

## New onboarding step order (10 steps)
1. **Welcome** (existing) — `Sparkles`
2. **Set Up Your Workspace** (existing) — Projects, Vendors, Categories
3. **Track Transactions** (existing) — Expense/Income toggle
4. **Organize with Projects** (existing — moved up)
5. **Receipts & GST Export** (NEW) — `Receipt` icon. "Attach receipts from camera or gallery, tag entries with GST, and export a CA-ready ZIP with CSVs + receipt images for tax filing."
6. **Recurring & Part Payments** (NEW) — `RefreshCcw` icon. "Automate rent, salaries and subscriptions with recurring schedules. Track multi-installment vendor payments inline."
7. **Team & Roles** (NEW) — `Users` icon. "Invite up to 3 members. Owner manages billing & team, Admin handles all data, Employee logs entries for assigned projects only."
8. **Backups & Sync** (NEW) — `CloudCheck` icon. "Twice-daily automated backups + offline-first sync. Your data stays safe even without internet."
9. **AI Insights** (existing — moved here) — `PieChart`
10. **Choose Your Look** (existing) — theme picker
11. **Install the App** (existing) — PWA install instructions
12. **Activate Your 7-Day Free Trial** (NEW final card) — see structure below

> Notifications and Stay Notified step is dropped (low-signal).

## "Activate Trial" final card
Branded card with:
- Heading: **"Start your 7-day free trial"**
- Pricing block (mirrors Billing page):
  - **₹599/month** (large), "incl. 18% GST"
  - Subscription net ₹507.63 + GST ₹91.37 row breakdown
- 4 feature ticks: 7-day free trial · Up to 3 team members · Unlimited transactions/projects · Cancel anytime (access until period end)
- Info chip (amber/blue): "**₹1–₹5 refundable verification charge** required by RBI for recurring mandates. Auto-refunded in 5–7 business days. First ₹599 charge happens only after the 7-day trial."
- Primary button: **"Activate Trial → "** → calls `onComplete()` (marks `onboarding_completed = true`) then `navigate(appPath('/billing'))`
- No "Maybe later" / no skip — only the activate button + Back button

## Behaviour changes
- **Remove** the "Skip tour" link entirely (no skip on any step).
- **Remove** the per-step skip handler.
- Progress dots remain; user must click Next through all steps.
- `onComplete` signature unchanged; final card additionally navigates to `/billing` after marking complete.
- If subscription is already active/trialing/comped (re-onboarding edge case), the final card swaps its CTA to **"Go to Dashboard"** instead of routing to billing.

## Files touched
- `src/components/OnboardingFlow.tsx` — add 4 new step entries, drop Bell step, append `TrialActivationCard` component, remove skip button, accept new `onActivateTrial` callback prop, import `useNavigate` + `useSubscription`.
- `src/pages/Index.tsx` — pass `onActivateTrial` handler that calls `completeOnboarding()` then navigates to `appPath('/billing')`.

## Out of scope
- No DB migration (uses existing `profiles.onboarding_completed`).
- No changes to Billing page itself.
- No changes to subscription flow / Razorpay code.

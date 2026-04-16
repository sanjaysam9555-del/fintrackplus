
User is asking about giving free access (e.g., for themselves as owner, internal team, beta testers, friends). Currently the app has a hard paywall — only `trialing` or `active` subscriptions get in. No bypass exists.

Options to offer:
1. **Comp/exempt orgs** — flag on `subscriptions` (or `organizations`) that grants permanent access without Razorpay. Cleanest, scales for multiple free users.
2. **Manually set status='active'** with far-future `current_period_end` — quick hack, no schema change, but mixes with real paying data.
3. **Lifetime plan** — new status value `comped` treated as active.

Recommend option 1 — a dedicated `is_comped` boolean + optional `comped_reason` + `comped_until` (nullable for permanent). Owner-only management via a hidden admin tool (or just direct DB for now).

Keep the plan short — this is a small change.



## Plan: Fix admin comp route + improve UX

### Issue 1 — 404 on `/admin/comp`
On `fintrackplus.com` (landing domain), only `/application/admin/comp` is registered. Plain `/admin/comp` falls through to the Landing component → looks like 404.

**Fix:** In `src/App.tsx`, inside the `isLandingDomain()` branch, register `/admin/comp` to render `<AdminComp />` directly (bypass landing). Keep `/application/admin/comp` as backward-compat alias. Per user's choice (Root domain only), do NOT add it to `app.fintrackplus.com`.

### Issue 2 — UI is too technical
Current cards show: org name, owner email, raw UUID. Missing the **owner's actual name** and clearer plan info. Also the React `forwardRef` warning on `Badge` is just a noise warning (Badge already uses forwardRef — actually it's the lazy wrapper warning, harmless), but we'll polish layout regardless.

**Edge function change** (`supabase/functions/admin-comp/index.ts`):
- Also fetch `profiles` (name, avatar_url) for each owner_id, and join into the response as `owner_name` and `owner_avatar_url`.
- Include `created_at` of org so we can show "Joined X ago".

**Page change** (`src/pages/AdminComp.tsx`):
Redesigned card layout:

```text
┌─────────────────────────────────────────────────┐
│ [Avatar]  Saffron Events            [Comped]   │
│           Sanjay Singh · sanjay@…              │
│           Joined 2 months ago                  │
│                                                 │
│ Plan: Trialing · Trial ends Apr 30             │
│ ─────────────────────────────────────           │
│ [✓] Complimentary access                       │
│ Reason: [Founder         ]                     │
│ Until:  [empty = permanent]                    │
│                                  [Save]        │
└─────────────────────────────────────────────────┘
```

Improvements:
- Owner avatar (circle, fallback to initials) on the left
- **Owner name** as the secondary line (bold-ish), email muted below
- Org UUID hidden behind a small "ID" copy button (cleaner, copy-on-click)
- Plan summary written in plain English: "Trial ends 30 Apr 2026", "Active until 15 May 2026", "Complimentary — permanent" / "Complimentary until 31 Dec 2026", "No subscription"
- Search hint updated: "Search by org or owner name…"
- Comped badge gets a subtle gradient

### Files touched
| File | Change |
|---|---|
| `src/App.tsx` | Add `/admin/comp` route on landing domain |
| `supabase/functions/admin-comp/index.ts` | Enrich list with owner profile name + avatar |
| `src/pages/AdminComp.tsx` | New friendlier card layout with avatar, owner name, plain-English plan status, copyable org ID |

### Access after fix
- `https://fintrackplus.com/admin/comp` ✅ (primary)
- `https://fintrackplus.com/application/admin/comp` ✅ (alias)

Anyone not in `SUPER_ADMIN_USER_IDS` still sees the 404 screen.


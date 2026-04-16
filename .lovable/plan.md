

User confirms Part B only, plus explicitly wants comp add/remove capability retained inside the new console.

## Plan: Admin Console (Part B + Comp management)

### Edge function — `admin-console` (replaces `admin-comp`)
Super-admin gated (existing allowlist). Actions:

| Action | Purpose |
|---|---|
| `list_orgs` | All orgs enriched with: owner profile (name/avatar/email), `member_count`, `transaction_count`, `last_activity_at`, `health` (`active`/`idle`/`empty`/`orphan-duplicate`), full subscription block |
| `list_users` | All auth users with: profile, list of org memberships (org_id + name + role + status), flags `owns_multiple_orgs`, `never_logged_in` |
| `stats` | Totals by health, user counts, subscription mix |
| `update_comp` | Toggle `is_comped` / `comped_reason` / `comped_until` (same as today) |
| `delete_org` | Cascading delete: transactions, partners, categories, vendors, projects, project_labels, project_documents, notifications, change_approvals, subscriptions, backups, org_members, profiles (only if user has no other org), then organization |

Health rules:
- `active` — has txns in last 30d
- `idle` — has txns, none last 30d
- `empty` — zero txns, only owner as member
- `orphan-duplicate` — owner is also active member of a different org

### New page — `src/pages/AdminConsole.tsx`
Tabs (shadcn Tabs): **Organizations** | **Users** | **Stats**

**Organizations tab**
- Top: stats strip ("10 orgs · 3 active · 2 idle · 5 empty/orphan") + filter chips `All / Active / Idle / Empty / Orphan` + search
- Card per org:
  - Header: org name + logo + health badge
  - Owner row: avatar, name, email
  - Activity: "127 txns · last activity 2d ago · 3 members"
  - Plan summary in plain English + Comped badge if active
  - Expandable footer with:
    - **Comp toggle** (add/remove comp), reason input, until date input, Save button
    - **Delete org** button (red, opens confirm dialog showing cascade preview: "Will delete X txns, Y projects, Z documents…")

**Users tab**
- Row per auth user: avatar, name, email, joined date
- Org membership chips: "Saffron Events (Owner)" "My Organization (Owner – orphan)"
- Issue chips: "Owns 2 orgs" / "Never logged in"
- Read-only (merge/delete deferred to Part A)

**Stats tab**
- Plain cards: Total orgs, Real orgs, Empty/Orphan orgs, Total users, Active subs, Comped, Trialing

### Routing — `src/App.tsx`
- `/admin` → `<AdminConsole />` (root domain, primary)
- `/admin/comp` → `<AdminConsole />` (alias — backward compat)
- `/application/admin` and `/application/admin/comp` → also alias

### Files
| File | Change |
|---|---|
| `supabase/functions/admin-console/index.ts` | New — multi-action API with health/stats + comp + delete |
| `supabase/functions/admin-comp/` | Delete |
| `src/pages/AdminConsole.tsx` | New tabbed console (Orgs / Users / Stats) with comp + delete controls |
| `src/pages/AdminComp.tsx` | Delete |
| `src/App.tsx` | Route updates |

### Out of scope (Part A — later)
Trigger fixes, smart invite migration, auto-healing orphans, user merge/delete actions.




Let me investigate the actual data first to understand what's happening.
<lov-tool-use id="toolu_vrtx_011N1yuyqyoCYhNxmmXBPYMc" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT o.id, o.name, o.is_personal, o.owner_id, p.name as owner_name, (SELECT count(*) FROM org_members om WHERE om.org_id = o.id AND om.status='active') as members, (SELECT count(*) FROM transactions t WHERE t.org_id = o.id) as txns FROM organizations o LEFT JOIN profiles p ON p.user_id = o.owner_id ORDER BY o.created_at;\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01F9Qa26CqUnbX5kkhRuEF4v" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT om.user_id, p.name, om.org_id, o.name as org_name, om.role, om.status FROM org_members om LEFT JOIN profiles p ON p.user_id = om.user_id LEFT JOIN organizations o ON o.id = om.org_id ORDER BY p.name;\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_015GZG44MaGxm7TFcmAiCt4R" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT o.id, o.name, o.is_personal, o.owner_id, p.name as owner_name, (SELECT count(*) FROM org_members om WHERE om.org_id = o.id AND om.status='active') as members, (SELECT count(*) FROM transactions t WHERE t.org_id = o.id) as txns FROM organizations o LEFT JOIN profiles p ON p.user_id = o.owner_id ORDER BY o.created_at;\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Fm547U1HfVSoxGybM6zW2r" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT om.user_id, p.name, om.org_id, o.name as org_name, om.role, om.status, o.is_personal FROM org_members om LEFT JOIN profiles p ON p.user_id = om.user_id LEFT JOIN organizations o ON o.id = om.org_id ORDER BY p.name;\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01LBQhuZHQi9G9pqJGHaLbjo" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/AdminConsole.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01H71RRXAb3iu6P61Jqk8FkR" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/AdminConsole.tsx\", \"lines\": \"432-521\"}">
</lov-tool-use>
I have all the info I need. Now I understand both issues clearly:

**Issue 1:** Saffron Events shows correctly (475 txns, 2 members including Swati). Swati's name appearing on a separate "My Organization" row in the Orgs tab is just the **stale empty personal org** (`bd3cf264…`) — already classified as `personal` after our reclassification. So in the Orgs tab, Swati's correct membership shows under Saffron Events; the "My Organization" row is not "her org" — it's a leftover marked Personal.

But the user expects the Admin Console to show, **per user**, their currently active org. That's the Users tab job — which already does that. The confusion: in Orgs tab, "My Organization · owner Swati Sharma" looks like Swati's data org, but txns=0 because data lives in Saffron Events.

**Fix for Issue 1:** Make the Personal org card visually clearer — show a "Solo signup leftover · user is now active in: Saffron Events" line on personal orgs whose owner is active elsewhere. Optionally hide them by default.

**Issue 2:** No comp / expand on Users tab. Need per-user comp (which actually means comping the org they belong to) + expand details. Since comp is org-level in our schema, "comp a user" = comp their active org. Add expandable user card with comp controls for each active org.

<lov-plan>

## Plan: Fix Admin Console org/user display + per-user comp

### Issue 1 — Swati on "My Organization" row with 0 txns
This row IS classified as `personal` (correct — it's her stale solo signup). Saffron Events (her real org, 475 txns, 2 members incl. Swati) is also there, just on a different card. The display is misleading because:
- Personal-org cards show the owner's name without context that they actually work in another org
- Personal-org cards aren't visually distinct from a "real" org

**Fix:**
- On Personal org cards where the owner is also an active member of another (non-personal) org, show a clear inline note: **"Stale solo signup — owner now active in: [Real Org Name]"** with a link/badge.
- Add a **"Hide personal/stale orgs"** toggle (default ON) so the Orgs tab shows real team/solo orgs by default. The 7 leftover "My Organization" rows will be hidden behind the toggle.
- Edge function (`admin-console` → `list_orgs`): enrich each org with `owner_active_org_name` (lookup `org_members` → `organizations.name` for owner's active membership where `org_id != this.id`).

### Issue 2 — Users tab needs comp + expand
Today users render as compact rows with no actions. Since "comp" is per-org in our schema, "comp a user" = comp the org(s) they're an active member of.

**Fix:**
- Make `UserRowCard` collapsible (Collapsible like `OrgCard`).
- Expanded view shows:
  - All memberships (active + inactive) with org name, role, status
  - Per active org: a **"Manage subscription"** mini-block (Comp toggle, reason, expiry date, Save) — same controls as `OrgCard` but scoped per org
  - Account meta (created, last sign-in, email)
- Reuse the existing `update_comp` action; no new edge function code needed.
- Add a small **"Comped"** badge to user row when any of their active orgs is currently comped (edge function returns this flag per user).

### Files
| File | Change |
|---|---|
| `supabase/functions/admin-console/index.ts` | `list_orgs`: add `owner_active_org_name`. `list_users`: add `comped_org_ids` per user + `subscription` for each membership |
| `src/pages/AdminConsole.tsx` | Org card: stale-leftover note. Orgs tab: "Hide personal/stale" toggle (default on). User card: collapsible with per-org comp controls + memberships detail + Comped badge |

### Result
- Orgs tab default view: **3 cards** — Saffron Events, Guneet's org, Shaadi Mai's solo. The 7 "My Organization" leftovers hidden. Toggle to reveal them with a clear "Stale solo signup — now in Saffron Events" note on Swati's leftover.
- Users tab: each user row expandable with full memberships and per-org comp controls.


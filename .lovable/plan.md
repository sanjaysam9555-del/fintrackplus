

## Add Organization Branding (Name + Logo) Across the App

### Overview
Add the ability for owners to see and edit their organization's name and logo. Display it as a compact badge on the Dashboard home screen and as a dedicated editable card on the Settings page.

### Database Changes

**Migration — Add `logo_url` column + allow owners to update organizations:**
```sql
ALTER TABLE public.organizations ADD COLUMN logo_url text;

-- Allow owners to update their org (name, logo)
CREATE POLICY "Owners can update their org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = get_user_org_id(auth.uid()) AND get_user_role(auth.uid()) = 'owner'::app_role)
  WITH CHECK (id = get_user_org_id(auth.uid()) AND get_user_role(auth.uid()) = 'owner'::app_role);
```

**Storage — Create `org-logos` public bucket** for org logo uploads.

### Store Changes

**`src/lib/store.ts`** — Add org data to the store:
- New state: `orgName: string`, `orgLogoUrl: string | null`
- New action: `setOrgInfo(name, logoUrl)`
- Fetch org info during `syncFromCloud` using the existing `organizations` table query
- Update org info when owner edits it

### New Component: `OrgEditSheet.tsx`

A bottom sheet (similar to `ProfileEditSheet`) for owners to:
- Edit org name (text input)
- Upload org logo (image picker → upload to `org-logos` bucket)
- Preview current logo
- Save updates to `organizations` table

### Dashboard Changes (`src/components/Dashboard.tsx`)

Add a small badge above the greeting on mobile:
```text
┌─────────────────────────────┐
│ [logo] My Organization      │  ← small, muted text + tiny logo
│ Good morning,               │
│ John                        │
└─────────────────────────────┘
```
- Reads `orgName` and `orgLogoUrl` from the store
- Shows org logo (16×16 rounded) + org name in `text-[11px] text-muted-foreground`
- Same pattern on desktop layout

### Settings Changes (`src/components/SettingsPage.tsx`)

Add a dedicated org card **above** the profile card:
```text
┌─────────────────────────────┐
│ [logo]  My Organization     │
│         Owner · 3 members   │
│                          >  │
└─────────────────────────────┘
┌─────────────────────────────┐
│ [avatar]  John Doe          │
│           john@example.com  │
└─────────────────────────────┘
```
- Tapping it opens `OrgEditSheet` (owner only)
- Non-owners see the card but it's not tappable
- Shows member count from org_members

### Files to create/modify

| File | Action |
|---|---|
| Migration | Add `logo_url` to organizations, add UPDATE policy for owners |
| Storage bucket | Create `org-logos` (public) |
| `src/lib/store.ts` | Add `orgName`, `orgLogoUrl` state; fetch in sync; add `setOrgInfo` |
| `src/components/OrgEditSheet.tsx` | New — edit org name + upload logo |
| `src/components/Dashboard.tsx` | Add org name badge above greeting (mobile + desktop) |
| `src/components/SettingsPage.tsx` | Add org card above profile card, import OrgEditSheet |


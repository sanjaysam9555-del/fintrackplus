

## Backup & Restore Feature

### Overview
Create an automated backup system that snapshots all org data twice daily, with a "Restore" section in Settings allowing owners to view and restore any backup.

### Database Changes

**1. New `backups` table** (migration):
```sql
CREATE TABLE public.backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  created_by uuid NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}',
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- Only owners can view/create/delete backups
CREATE POLICY "Org owners can view backups" ON public.backups FOR SELECT TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) AND get_user_role(auth.uid()) = 'owner');
CREATE POLICY "Org owners can insert backups" ON public.backups FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id(auth.uid()) AND get_user_role(auth.uid()) = 'owner');
CREATE POLICY "Org owners can delete backups" ON public.backups FOR DELETE TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) AND get_user_role(auth.uid()) = 'owner');
```

**2. Scheduled edge function** for automatic twice-daily backups (morning 6 AM, evening 6 PM IST) via pg_cron + pg_net.

### Edge Function: `create-backup`

New `supabase/functions/create-backup/index.ts`:
- Accepts POST with optional `label` param
- Uses service role key to fetch ALL org data: transactions, categories, vendors, projects, partners, project_labels, profiles, org_members, notifications
- Stores everything as a single JSON snapshot in `backups.snapshot`
- Auto-labels: "Morning Backup — Mar 20, 2026 6:00 AM" or "Evening Backup — Mar 20, 2026 6:00 PM"
- Can also be triggered manually from the UI

Config in `supabase/config.toml`:
```toml
[functions.create-backup]
verify_jwt = false
```

### Edge Function: `restore-backup`

New `supabase/functions/restore-backup/index.ts`:
- Accepts POST with `backup_id`
- Verifies caller is an owner
- Reads the snapshot JSON
- In a transaction-like sequence: deletes all current org data (transactions, categories, vendors, projects, partners, project_labels) then re-inserts everything from the snapshot
- Preserves auth users and org_members (team structure stays intact)
- Returns success/failure

Config:
```toml
[functions.restore-backup]
verify_jwt = false
```

### UI: New Settings Section

**`src/components/settings/BackupRestoreSection.tsx`** — New component:
- Header with back arrow, title "Backup & Restore"
- **Create Backup** button at top — triggers manual backup via edge function
- **Backup List** — fetches from `backups` table, shows each backup as a card:
  - Label (e.g. "Morning Backup — Mar 20, 2026 6:00 AM")
  - Timestamp ("2 hours ago")
  - Summary counts: "142 transactions, 8 categories, 5 vendors, 12 projects, 3 partners, 4 labels"
  - "Restore" button with confirmation dialog warning that all current data will be replaced
- Loading/empty states

**`src/components/SettingsPage.tsx`** — Changes:
- Add "Backup & Restore" to `menuItems` under a new "Backup" section (owner-only)
- Add `activeSection === 'backup'` routing to render `BackupRestoreSection`
- Import `DatabaseBackup` icon from lucide-react

### Scheduled Backup (pg_cron)

Enable `pg_cron` and `pg_net` extensions, then schedule:
- `0 0 * * *` (6 AM IST = 00:30 UTC) — "Morning Backup"
- `0 12 * * *` (6 PM IST = 12:30 UTC) — "Evening Backup"

Each cron job calls the `create-backup` edge function with appropriate label.

### Files to create/modify

| File | Action |
|---|---|
| Migration | Create `backups` table with RLS |
| `supabase/functions/create-backup/index.ts` | New — snapshot all org data |
| `supabase/functions/restore-backup/index.ts` | New — restore from snapshot |
| `supabase/config.toml` | Add function configs |
| `src/components/settings/BackupRestoreSection.tsx` | New — UI for backup list + restore |
| `src/components/SettingsPage.tsx` | Add Backup & Restore menu item + routing |
| pg_cron SQL (via insert tool) | Schedule twice-daily automatic backups |


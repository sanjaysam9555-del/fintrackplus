

## Fix: Enable Automatic Backups via pg_cron

### Problem
The `trigger_all_org_backups` DB function exists and works, but no cron job was ever scheduled to invoke it. The twice-daily automatic backups (6 AM / 6 PM IST) are not running.

### Fix
1. **Enable extensions** — Ensure `pg_cron` and `pg_net` are enabled via a migration.

2. **Schedule two cron jobs** — Use the database insert tool (not migration, since it contains project-specific URLs/keys) to create:
   - `auto-backup-morning`: runs at 6:00 AM IST (0:30 UTC) daily
   - `auto-backup-evening`: runs at 6:00 PM IST (12:30 UTC) daily

   Each job calls `trigger_all_org_backups()` with an appropriate label like `"Auto Backup — Morning 6 AM"`.

3. **Fix the function's HTTP call** — The current function uses `extensions.http_post` which is from the `http` extension, not `pg_net`. Need to verify which extension is available and use the correct function (`net.http_post` for pg_net).

### Implementation Detail

**Migration** — Enable extensions:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

**SQL insert (non-migration)** — Schedule the cron jobs:
```sql
SELECT cron.schedule(
  'auto-backup-morning',
  '30 0 * * *',
  $$SELECT public.trigger_all_org_backups('Auto Backup — Morning 6 AM')$$
);

SELECT cron.schedule(
  'auto-backup-evening',
  '30 12 * * *',
  $$SELECT public.trigger_all_org_backups('Auto Backup — Evening 6 PM')$$
);
```

**Update `trigger_all_org_backups`** — Replace `extensions.http_post` with `net.http_post` (pg_net's correct function signature) to ensure the HTTP call actually fires.

### Files to modify
| File | Change |
|---|---|
| Migration SQL | Enable `pg_cron` and `pg_net` extensions |
| SQL insert (non-migration) | Schedule two daily cron jobs |
| Migration SQL | Update `trigger_all_org_backups` to use `net.http_post` instead of `extensions.http_post` |



CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_all_org_backups(backup_label text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  org record;
BEGIN
  FOR org IN SELECT id FROM public.organizations LOOP
    PERFORM net.http_post(
      url := 'https://ilgoprsvztbqocbshtoe.supabase.co/functions/v1/create-backup',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsZ29wcnN2enRicW9jYnNodG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMTkzNjgsImV4cCI6MjA4MzY5NTM2OH0.m8dUmXdJ48VqbcIMkcficQTR2GgKL6zs4XiubtRakG0"}'::jsonb,
      body := jsonb_build_object('org_id', org.id, 'label', backup_label)
    );
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_all_org_backups(backup_label text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  org record;
  func_url text;
  anon_key text;
BEGIN
  func_url := current_setting('app.settings.supabase_url', true);
  anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  FOR org IN SELECT id FROM public.organizations LOOP
    PERFORM extensions.http_post(
      url := 'https://ilgoprsvztbqocbshtoe.supabase.co/functions/v1/create-backup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsZ29wcnN2enRicW9jYnNodG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMTkzNjgsImV4cCI6MjA4MzY5NTM2OH0.m8dUmXdJ48VqbcIMkcficQTR2GgKL6zs4XiubtRakG0'
      ),
      body := jsonb_build_object('org_id', org.id, 'label', backup_label)
    );
  END LOOP;
END;
$$;
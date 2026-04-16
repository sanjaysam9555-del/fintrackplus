ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS is_comped boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS comped_reason text,
  ADD COLUMN IF NOT EXISTS comped_until timestamptz;

CREATE OR REPLACE FUNCTION public.org_has_active_subscription(_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE org_id = _org_id
      AND (
        (is_comped = true AND (comped_until IS NULL OR comped_until > now()))
        OR status = 'active'
        OR (status = 'trialing' AND (trial_end IS NULL OR trial_end > now()))
      )
  );
$function$;
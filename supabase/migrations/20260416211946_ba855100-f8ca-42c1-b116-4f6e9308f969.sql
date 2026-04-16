CREATE OR REPLACE FUNCTION public.org_last_activity_at(_org_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_tx timestamptz;
  last_notif timestamptz;
  last_signin timestamptz;
  org_created timestamptz;
  result timestamptz;
BEGIN
  SELECT MAX(created_at) INTO last_tx FROM public.transactions WHERE org_id = _org_id;
  SELECT MAX(created_at) INTO last_notif FROM public.notifications WHERE org_id = _org_id;
  SELECT MAX(u.last_sign_in_at) INTO last_signin
    FROM auth.users u
    INNER JOIN public.org_members m ON m.user_id = u.id
    WHERE m.org_id = _org_id;
  SELECT created_at INTO org_created FROM public.organizations WHERE id = _org_id;

  result := GREATEST(
    COALESCE(last_tx, 'epoch'::timestamptz),
    COALESCE(last_notif, 'epoch'::timestamptz),
    COALESCE(last_signin, 'epoch'::timestamptz),
    COALESCE(org_created, 'epoch'::timestamptz)
  );
  RETURN result;
END;
$$;
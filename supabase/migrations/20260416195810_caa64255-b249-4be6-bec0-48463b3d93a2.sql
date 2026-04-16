-- 1. Add is_personal flag
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false;

-- 2. team_invites table
CREATE TABLE IF NOT EXISTS public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  inviter_user_id uuid NOT NULL,
  invitee_email text NOT NULL,
  invitee_user_id uuid,
  role public.app_role NOT NULL DEFAULT 'employee',
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  CONSTRAINT team_invites_status_check CHECK (status IN ('pending','accepted_merge','accepted_discard','rejected','cancelled','expired'))
);

CREATE INDEX IF NOT EXISTS idx_team_invites_invitee_email ON public.team_invites(lower(invitee_email)) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_team_invites_invitee_user ON public.team_invites(invitee_user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_team_invites_org ON public.team_invites(org_id);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invitees can view their invites" ON public.team_invites;
CREATE POLICY "Invitees can view their invites"
ON public.team_invites FOR SELECT TO authenticated
USING (
  invitee_user_id = auth.uid()
  OR lower(invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  OR org_id = public.get_user_org_id(auth.uid())
);

DROP POLICY IF EXISTS "Owners can insert invites for their org" ON public.team_invites;
CREATE POLICY "Owners can insert invites for their org"
ON public.team_invites FOR INSERT TO authenticated
WITH CHECK (
  org_id = public.get_user_org_id(auth.uid())
  AND public.get_user_role(auth.uid()) = 'owner'
  AND inviter_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Owners can cancel their invites" ON public.team_invites;
CREATE POLICY "Owners can cancel their invites"
ON public.team_invites FOR UPDATE TO authenticated
USING (
  org_id = public.get_user_org_id(auth.uid())
  AND public.get_user_role(auth.uid()) = 'owner'
);

-- 3. Helper: link existing pending invites to a user when they sign up
CREATE OR REPLACE FUNCTION public.link_pending_invites_to_user(_user_id uuid, _email text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.team_invites
  SET invitee_user_id = _user_id
  WHERE status = 'pending'
    AND invitee_user_id IS NULL
    AND lower(invitee_email) = lower(_email);
$$;

-- 4. Rewrite handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  invite_org_id uuid;
  user_name text;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');

  -- Path 1: pre-created via manage-team (org_member already exists)
  SELECT om.org_id INTO invite_org_id
  FROM public.org_members om WHERE om.user_id = NEW.id LIMIT 1;

  IF invite_org_id IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, name, org_id)
    VALUES (NEW.id, user_name, invite_org_id)
    ON CONFLICT DO NOTHING;
    PERFORM public.link_pending_invites_to_user(NEW.id, NEW.email);
    RETURN NEW;
  END IF;

  -- Path 2 & 3: self-signup → create personal org (is_personal=true)
  INSERT INTO public.organizations (name, owner_id, is_personal)
  VALUES ('Personal', NEW.id, true)
  RETURNING id INTO new_org_id;

  INSERT INTO public.org_members (org_id, user_id, role, must_change_password, status)
  VALUES (new_org_id, NEW.id, 'owner', false, 'active');

  INSERT INTO public.profiles (user_id, name, org_id)
  VALUES (NEW.id, user_name, new_org_id);

  INSERT INTO public.partners (user_id, name, org_id)
  VALUES (NEW.id, user_name, new_org_id);

  -- Link any pending invites that were sent to this email before signup
  PERFORM public.link_pending_invites_to_user(NEW.id, NEW.email);

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. accept_invite_merge: move invitee's solo org data into target org
CREATE OR REPLACE FUNCTION public.accept_invite_merge(_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
  solo_org_id uuid;
  target_member_count int;
BEGIN
  SELECT * INTO inv FROM public.team_invites WHERE id = _invite_id;
  IF inv IS NULL THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF inv.status <> 'pending' THEN RAISE EXCEPTION 'Invite is not pending'; END IF;
  IF inv.invitee_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorised'; END IF;

  SELECT org_id INTO solo_org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;
  IF solo_org_id IS NULL THEN RAISE EXCEPTION 'No source org'; END IF;
  IF solo_org_id = inv.org_id THEN RAISE EXCEPTION 'Already in target org'; END IF;

  SELECT count(*) INTO target_member_count FROM public.org_members
    WHERE org_id = inv.org_id AND status = 'active';
  IF target_member_count >= 3 THEN RAISE EXCEPTION 'Target org is full (3 members max)'; END IF;

  -- Dedupe categories by (lower(name), type)
  WITH dupes AS (
    SELECT s.id AS solo_id, t.id AS target_id
    FROM public.categories s
    JOIN public.categories t
      ON lower(t.name) = lower(s.name) AND t.type = s.type AND t.org_id = inv.org_id
    WHERE s.org_id = solo_org_id
  )
  UPDATE public.transactions tx SET category_id = d.target_id
  FROM dupes d WHERE tx.category_id = d.solo_id AND tx.org_id = solo_org_id;

  DELETE FROM public.categories s
  USING public.categories t
  WHERE s.org_id = solo_org_id
    AND t.org_id = inv.org_id
    AND lower(t.name) = lower(s.name) AND t.type = s.type;

  -- Dedupe vendors by lower(name)
  DELETE FROM public.vendors s
  USING public.vendors t
  WHERE s.org_id = solo_org_id
    AND t.org_id = inv.org_id
    AND lower(t.name) = lower(s.name);

  -- Move all org-scoped data
  UPDATE public.transactions SET org_id = inv.org_id WHERE org_id = solo_org_id;
  UPDATE public.categories SET org_id = inv.org_id WHERE org_id = solo_org_id;
  UPDATE public.vendors SET org_id = inv.org_id WHERE org_id = solo_org_id;
  UPDATE public.projects SET org_id = inv.org_id WHERE org_id = solo_org_id;
  UPDATE public.project_labels SET org_id = inv.org_id WHERE org_id = solo_org_id;
  UPDATE public.project_documents SET org_id = inv.org_id WHERE org_id = solo_org_id;
  UPDATE public.notifications SET org_id = inv.org_id WHERE org_id = solo_org_id;
  UPDATE public.partners SET org_id = inv.org_id WHERE org_id = solo_org_id;

  -- Move membership
  DELETE FROM public.org_members WHERE user_id = auth.uid() AND org_id = solo_org_id;
  INSERT INTO public.org_members (org_id, user_id, role, status, must_change_password)
  VALUES (inv.org_id, auth.uid(), inv.role, 'active', false)
  ON CONFLICT DO NOTHING;

  UPDATE public.profiles SET org_id = inv.org_id WHERE user_id = auth.uid();

  -- Delete the now-empty solo org
  DELETE FROM public.subscriptions WHERE org_id = solo_org_id;
  DELETE FROM public.backups WHERE org_id = solo_org_id;
  DELETE FROM public.change_approvals WHERE org_id = solo_org_id;
  DELETE FROM public.organizations WHERE id = solo_org_id;

  -- Promote target if it was personal (first teammate joining)
  UPDATE public.organizations SET is_personal = false WHERE id = inv.org_id AND is_personal = true;

  UPDATE public.team_invites
  SET status = 'accepted_merge', resolved_at = now()
  WHERE id = _invite_id;

  -- Notify inviter
  INSERT INTO public.notifications (org_id, user_id, type, title, message, entity_type, entity_id)
  VALUES (inv.org_id, inv.inviter_user_id, 'team_invite_accepted',
          'Invitation accepted',
          'Your invitation was accepted and their data was merged.',
          'team_invite', _invite_id::text);

  RETURN jsonb_build_object('status','accepted_merge','org_id',inv.org_id);
END;
$$;

-- 6. accept_invite_discard
CREATE OR REPLACE FUNCTION public.accept_invite_discard(_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
  solo_org_id uuid;
  target_member_count int;
BEGIN
  SELECT * INTO inv FROM public.team_invites WHERE id = _invite_id;
  IF inv IS NULL THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF inv.status <> 'pending' THEN RAISE EXCEPTION 'Invite is not pending'; END IF;
  IF inv.invitee_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorised'; END IF;

  SELECT org_id INTO solo_org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;
  IF solo_org_id IS NULL THEN RAISE EXCEPTION 'No source org'; END IF;
  IF solo_org_id = inv.org_id THEN RAISE EXCEPTION 'Already in target org'; END IF;

  SELECT count(*) INTO target_member_count FROM public.org_members
    WHERE org_id = inv.org_id AND status = 'active';
  IF target_member_count >= 3 THEN RAISE EXCEPTION 'Target org is full (3 members max)'; END IF;

  -- Wipe solo org data
  DELETE FROM public.transactions WHERE org_id = solo_org_id;
  DELETE FROM public.project_documents WHERE org_id = solo_org_id;
  DELETE FROM public.projects WHERE org_id = solo_org_id;
  DELETE FROM public.project_labels WHERE org_id = solo_org_id;
  DELETE FROM public.categories WHERE org_id = solo_org_id;
  DELETE FROM public.vendors WHERE org_id = solo_org_id;
  DELETE FROM public.partners WHERE org_id = solo_org_id;
  DELETE FROM public.notifications WHERE org_id = solo_org_id;
  DELETE FROM public.change_approvals WHERE org_id = solo_org_id;
  DELETE FROM public.subscriptions WHERE org_id = solo_org_id;
  DELETE FROM public.backups WHERE org_id = solo_org_id;
  DELETE FROM public.org_members WHERE org_id = solo_org_id;
  DELETE FROM public.organizations WHERE id = solo_org_id;

  INSERT INTO public.org_members (org_id, user_id, role, status, must_change_password)
  VALUES (inv.org_id, auth.uid(), inv.role, 'active', false)
  ON CONFLICT DO NOTHING;

  UPDATE public.profiles SET org_id = inv.org_id WHERE user_id = auth.uid();

  UPDATE public.organizations SET is_personal = false WHERE id = inv.org_id AND is_personal = true;

  UPDATE public.team_invites
  SET status = 'accepted_discard', resolved_at = now()
  WHERE id = _invite_id;

  INSERT INTO public.notifications (org_id, user_id, type, title, message, entity_type, entity_id)
  VALUES (inv.org_id, inv.inviter_user_id, 'team_invite_accepted',
          'Invitation accepted',
          'Your invitation was accepted (data discarded).',
          'team_invite', _invite_id::text);

  RETURN jsonb_build_object('status','accepted_discard','org_id',inv.org_id);
END;
$$;

-- 7. reject_invite
CREATE OR REPLACE FUNCTION public.reject_invite(_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
BEGIN
  SELECT * INTO inv FROM public.team_invites WHERE id = _invite_id;
  IF inv IS NULL THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF inv.status <> 'pending' THEN RAISE EXCEPTION 'Invite is not pending'; END IF;
  IF inv.invitee_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorised'; END IF;

  UPDATE public.team_invites SET status = 'rejected', resolved_at = now() WHERE id = _invite_id;

  INSERT INTO public.notifications (org_id, user_id, type, title, message, entity_type, entity_id)
  VALUES (inv.org_id, inv.inviter_user_id, 'team_invite_rejected',
          'Invitation declined',
          'Your invitation was declined.',
          'team_invite', _invite_id::text);

  RETURN jsonb_build_object('status','rejected');
END;
$$;

-- 8. cancel_invite (owner side)
CREATE OR REPLACE FUNCTION public.cancel_invite(_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
BEGIN
  SELECT * INTO inv FROM public.team_invites WHERE id = _invite_id;
  IF inv IS NULL THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF inv.status <> 'pending' THEN RAISE EXCEPTION 'Invite is not pending'; END IF;
  IF inv.org_id <> public.get_user_org_id(auth.uid()) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF public.get_user_role(auth.uid()) <> 'owner' THEN RAISE EXCEPTION 'Owner only'; END IF;

  UPDATE public.team_invites SET status = 'cancelled', resolved_at = now() WHERE id = _invite_id;
  RETURN jsonb_build_object('status','cancelled');
END;
$$;

-- 9. One-time cleanup: flag legacy single-owner empty orgs as personal
UPDATE public.organizations o
SET is_personal = true
WHERE is_personal = false
  AND NOT EXISTS (SELECT 1 FROM public.transactions t WHERE t.org_id = o.id)
  AND (SELECT count(*) FROM public.org_members m WHERE m.org_id = o.id AND m.status = 'active') = 1
  AND o.name IN ('My Organization','Personal');
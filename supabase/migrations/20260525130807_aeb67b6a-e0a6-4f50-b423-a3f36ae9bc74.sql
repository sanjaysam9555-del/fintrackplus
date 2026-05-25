-- 1) Notifications: scope to the recipient, not the whole org
DROP POLICY IF EXISTS "Org members can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Org members can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Org members can delete notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()) AND user_id = auth.uid())
WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()) AND user_id = auth.uid());

-- INSERT policy unchanged (org members can create notifications addressed to anyone in their org)

-- 2) Team invites: hide invitee emails from regular employees
DROP POLICY IF EXISTS "Invitees can view their invites" ON public.team_invites;

CREATE POLICY "Invitees and org admins can view invites"
ON public.team_invites
FOR SELECT
TO authenticated
USING (
  invitee_user_id = auth.uid()
  OR lower(invitee_email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))
  OR (
    org_id = public.get_user_org_id(auth.uid())
    AND public.get_user_role(auth.uid()) IN ('owner'::public.app_role, 'admin'::public.app_role)
  )
);

-- 3) Org logos storage: drop overly-permissive member policies; owner-only policies already exist
DROP POLICY IF EXISTS "Org members can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Org members can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete logos" ON storage.objects;

-- Collapse duplicate public-read policies on org-logos
DROP POLICY IF EXISTS "Public read org logos" ON storage.objects;
-- Keep "Public can view org logos" for read access
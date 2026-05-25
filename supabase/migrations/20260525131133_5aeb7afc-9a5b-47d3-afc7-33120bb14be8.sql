
-- 1) change_approvals: restrict SELECT
DROP POLICY IF EXISTS "Org members can view their change approvals" ON public.change_approvals;
CREATE POLICY "Requester target or admins can view change approvals"
ON public.change_approvals
FOR SELECT
TO authenticated
USING (
  org_id = public.get_user_org_id(auth.uid())
  AND (
    requester_user_id = auth.uid()
    OR target_user_id = auth.uid()
    OR public.get_user_role(auth.uid()) = ANY (ARRAY['owner'::app_role, 'admin'::app_role])
  )
);

-- 2) notifications: tighten INSERT so members can't spoof notifications for others
DROP POLICY IF EXISTS "Org members can insert notifications" ON public.notifications;
CREATE POLICY "Members insert self admins insert any"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = public.get_user_org_id(auth.uid())
  AND (
    user_id = auth.uid()
    OR public.get_user_role(auth.uid()) = ANY (ARRAY['owner'::app_role, 'admin'::app_role])
  )
);

-- 3) project-documents storage: align SELECT/DELETE with org membership
DROP POLICY IF EXISTS "Users can view their own project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload project documents" ON storage.objects;

CREATE POLICY "Org members can view project documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND public.get_user_org_id(((storage.foldername(name))[1])::uuid) = public.get_user_org_id(auth.uid())
  AND public.get_user_org_id(auth.uid()) IS NOT NULL
);

CREATE POLICY "Org members can upload project documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners and admins can delete project documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND public.get_user_org_id(((storage.foldername(name))[1])::uuid) = public.get_user_org_id(auth.uid())
  AND public.get_user_role(auth.uid()) = ANY (ARRAY['owner'::app_role, 'admin'::app_role])
);

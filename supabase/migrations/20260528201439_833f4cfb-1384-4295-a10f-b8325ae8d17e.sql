
-- 1. Restrict change_approvals UPDATE: target user can only change status/resolved_at, not proposed_changes or routing fields
DROP POLICY IF EXISTS "Target user can update change approvals" ON public.change_approvals;

CREATE POLICY "Target user can resolve change approvals"
ON public.change_approvals
FOR UPDATE
TO authenticated
USING (
  (target_user_id = auth.uid())
  AND (org_id = public.get_user_org_id(auth.uid()))
)
WITH CHECK (
  (target_user_id = auth.uid())
  AND (org_id = public.get_user_org_id(auth.uid()))
  -- Immutable fields: target user cannot rewrite the proposal or re-route it
  AND (proposed_changes = (SELECT ca.proposed_changes FROM public.change_approvals ca WHERE ca.id = change_approvals.id))
  AND (entity_type    = (SELECT ca.entity_type    FROM public.change_approvals ca WHERE ca.id = change_approvals.id))
  AND (entity_id      = (SELECT ca.entity_id      FROM public.change_approvals ca WHERE ca.id = change_approvals.id))
  AND (action         = (SELECT ca.action         FROM public.change_approvals ca WHERE ca.id = change_approvals.id))
  AND (requester_user_id = (SELECT ca.requester_user_id FROM public.change_approvals ca WHERE ca.id = change_approvals.id))
  AND (target_user_id    = (SELECT ca.target_user_id    FROM public.change_approvals ca WHERE ca.id = change_approvals.id))
  AND (org_id            = (SELECT ca.org_id            FROM public.change_approvals ca WHERE ca.id = change_approvals.id))
);

-- 2. Project documents storage: require org membership on uploads
DROP POLICY IF EXISTS "Org members can upload project documents" ON storage.objects;

CREATE POLICY "Org members can upload project documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND public.get_user_org_id(auth.uid()) IS NOT NULL
);

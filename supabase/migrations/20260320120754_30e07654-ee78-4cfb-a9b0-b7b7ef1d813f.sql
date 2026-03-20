-- Allow employees to insert their own transactions
CREATE POLICY "Employees can insert own transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (
    org_id = get_user_org_id(auth.uid())
    AND user_id = auth.uid()
  );

-- Backfill missing partner records for org members who don't have one
INSERT INTO public.partners (user_id, name, org_id, role, color)
SELECT om.user_id, p.name, om.org_id, om.role::text, '#3B82F6'
FROM public.org_members om
JOIN public.profiles p ON p.user_id = om.user_id
WHERE om.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.partners pt 
    WHERE pt.user_id = om.user_id AND pt.org_id = om.org_id
  );
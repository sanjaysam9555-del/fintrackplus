CREATE TABLE public.backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}',
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can view backups" ON public.backups
  FOR SELECT TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) AND get_user_role(auth.uid()) = 'owner');

CREATE POLICY "Org owners can insert backups" ON public.backups
  FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id(auth.uid()) AND get_user_role(auth.uid()) = 'owner');

CREATE POLICY "Org owners can delete backups" ON public.backups
  FOR DELETE TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) AND get_user_role(auth.uid()) = 'owner');
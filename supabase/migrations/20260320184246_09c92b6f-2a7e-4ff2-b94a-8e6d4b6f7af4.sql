
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url text;

CREATE POLICY "Owners can update their org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = get_user_org_id(auth.uid()) AND get_user_role(auth.uid()) = 'owner'::app_role)
  WITH CHECK (id = get_user_org_id(auth.uid()) AND get_user_role(auth.uid()) = 'owner'::app_role);

-- Create org-logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true);

-- Storage RLS: anyone can view
CREATE POLICY "Public read org logos" ON storage.objects FOR SELECT USING (bucket_id = 'org-logos');

-- Only owners can upload
CREATE POLICY "Owners can upload org logos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'org-logos' AND get_user_role(auth.uid()) = 'owner'::app_role);

-- Only owners can update
CREATE POLICY "Owners can update org logos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'org-logos' AND get_user_role(auth.uid()) = 'owner'::app_role);

-- Only owners can delete
CREATE POLICY "Owners can delete org logos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'org-logos' AND get_user_role(auth.uid()) = 'owner'::app_role);

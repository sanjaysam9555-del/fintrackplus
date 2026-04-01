
-- Create storage bucket for org logos
INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their org's folder
CREATE POLICY "Org members can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'org-logos');

-- Allow public read access
CREATE POLICY "Public can view org logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'org-logos');

-- Allow org members to update/delete their logos
CREATE POLICY "Org members can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'org-logos');

CREATE POLICY "Org members can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'org-logos');

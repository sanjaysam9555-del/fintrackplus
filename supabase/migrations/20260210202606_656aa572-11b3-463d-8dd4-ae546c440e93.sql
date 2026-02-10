
-- Add avatar_url column to partners table
ALTER TABLE public.partners ADD COLUMN avatar_url text;

-- Create partner-avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('partner-avatars', 'partner-avatars', true);

-- RLS policies for partner-avatars bucket
CREATE POLICY "Users can upload partner avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'partner-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update partner avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'partner-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete partner avatars" ON storage.objects FOR DELETE USING (bucket_id = 'partner-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Partner avatars are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'partner-avatars');

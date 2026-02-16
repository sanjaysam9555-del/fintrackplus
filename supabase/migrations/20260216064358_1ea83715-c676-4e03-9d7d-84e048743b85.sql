
-- Create project_documents table
CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_size BIGINT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own project documents"
ON public.project_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project documents"
ON public.project_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project documents"
ON public.project_documents FOR DELETE
USING (auth.uid() = user_id);

-- Create private storage bucket for project documents
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', false);

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload project documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own project documents
CREATE POLICY "Users can view their own project documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own project documents
CREATE POLICY "Users can delete their own project documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for project_documents
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_documents;

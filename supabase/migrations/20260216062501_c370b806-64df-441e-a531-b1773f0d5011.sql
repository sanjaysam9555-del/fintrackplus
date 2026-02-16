
-- Create project_labels table
CREATE TABLE public.project_labels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#8B5CF6',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_labels ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own project_labels"
  ON public.project_labels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project_labels"
  ON public.project_labels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project_labels"
  ON public.project_labels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project_labels"
  ON public.project_labels FOR DELETE
  USING (auth.uid() = user_id);

-- Add label_ids to projects table
ALTER TABLE public.projects ADD COLUMN label_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Enable realtime for project_labels
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_labels;

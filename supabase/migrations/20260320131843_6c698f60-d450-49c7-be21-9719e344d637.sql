
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id text,
  ADD COLUMN IF NOT EXISTS actor_name text;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

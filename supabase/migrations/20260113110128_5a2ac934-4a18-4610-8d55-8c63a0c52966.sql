-- Table to store Google Sheets integration settings per user
CREATE TABLE public.google_sheets_integration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  spreadsheet_id TEXT,
  spreadsheet_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_sheets_integration ENABLE ROW LEVEL SECURITY;

-- Users can only view their own integration
CREATE POLICY "Users can view their own sheets integration"
ON public.google_sheets_integration
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own integration
CREATE POLICY "Users can insert their own sheets integration"
ON public.google_sheets_integration
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own integration
CREATE POLICY "Users can update their own sheets integration"
ON public.google_sheets_integration
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own integration
CREATE POLICY "Users can delete their own sheets integration"
ON public.google_sheets_integration
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_google_sheets_integration_updated_at
BEFORE UPDATE ON public.google_sheets_integration
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
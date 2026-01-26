-- Create partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  initial_cash_balance numeric NOT NULL DEFAULT 0,
  initial_online_balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own partners" 
  ON public.partners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own partners" 
  ON public.partners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own partners" 
  ON public.partners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own partners" 
  ON public.partners FOR DELETE USING (auth.uid() = user_id);

-- Add partner_id to transactions
ALTER TABLE public.transactions 
  ADD COLUMN partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;

-- Enable realtime for partners table
ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;
-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT UNIQUE,
  plan_id TEXT,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing','active','past_due','cancelled','expired','halted','created')),
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  customer_gstin TEXT,
  customer_business_name TEXT,
  customer_address TEXT,
  customer_state_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_org_id ON public.subscriptions(org_id);
CREATE INDEX idx_subscriptions_razorpay_sub_id ON public.subscriptions(razorpay_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their subscription"
ON public.subscriptions FOR SELECT
TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()));

-- No direct INSERT/UPDATE/DELETE from clients; service role handles it via edge functions.

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_invoice_id TEXT,
  invoice_number TEXT NOT NULL UNIQUE,
  amount_total NUMERIC NOT NULL,
  amount_net NUMERIC NOT NULL,
  gst_amount NUMERIC NOT NULL,
  cgst_amount NUMERIC NOT NULL DEFAULT 0,
  sgst_amount NUMERIC NOT NULL DEFAULT 0,
  igst_amount NUMERIC NOT NULL DEFAULT 0,
  gst_type TEXT NOT NULL CHECK (gst_type IN ('CGST_SGST','IGST')),
  gst_rate NUMERIC NOT NULL DEFAULT 18,
  customer_gstin TEXT,
  customer_business_name TEXT,
  customer_address TEXT,
  pdf_path TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_org_id ON public.invoices(org_id);
CREATE INDEX idx_invoices_subscription_id ON public.invoices(subscription_id);
CREATE INDEX idx_invoices_paid_at ON public.invoices(paid_at DESC);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()));

-- No direct INSERT/UPDATE/DELETE from clients; service role only.

-- ============================================================================
-- INVOICE NUMBER SEQUENCE PER FY
-- ============================================================================
CREATE TABLE public.invoice_counters (
  fy TEXT NOT NULL PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;
-- No client access; service role only.

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fy_label TEXT;
  yr INTEGER;
  next_num INTEGER;
BEGIN
  -- Indian FY: Apr-Mar. e.g. 2025-26
  IF EXTRACT(MONTH FROM now() AT TIME ZONE 'Asia/Kolkata') >= 4 THEN
    yr := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Kolkata')::INT;
  ELSE
    yr := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Kolkata')::INT - 1;
  END IF;
  fy_label := yr::TEXT || '-' || LPAD(((yr + 1) % 100)::TEXT, 2, '0');

  INSERT INTO public.invoice_counters (fy, last_number)
  VALUES (fy_label, 1)
  ON CONFLICT (fy) DO UPDATE SET last_number = public.invoice_counters.last_number + 1
  RETURNING last_number INTO next_num;

  RETURN 'FT/' || fy_label || '/' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- ============================================================================
-- HELPER: check if org has active subscription (trialing or active counts)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.org_has_active_subscription(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE org_id = _org_id
      AND status IN ('trialing','active')
      AND (trial_end IS NULL OR trial_end > now() OR status = 'active')
  );
$$;

-- ============================================================================
-- GRANDFATHERING: give every existing org a 7-day trial
-- ============================================================================
INSERT INTO public.subscriptions (org_id, status, trial_end, plan_id)
SELECT
  o.id,
  'trialing',
  now() + INTERVAL '7 days',
  'plan_SeEv6ZiicLzeNf'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.org_id = o.id
);

-- ============================================================================
-- STORAGE BUCKET FOR INVOICE PDFs
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org members can read their invoice PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices'
  AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text
);

-- Service role handles writes; no client INSERT policy needed.

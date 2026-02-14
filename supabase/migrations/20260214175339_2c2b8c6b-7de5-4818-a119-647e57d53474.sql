
-- Drop the unused google_sheets_integration table to eliminate plaintext token risk
DROP TABLE IF EXISTS public.google_sheets_integration;

-- Add CHECK constraints for input validation on key tables
ALTER TABLE public.transactions
  ADD CONSTRAINT chk_transactions_amount CHECK (amount >= 0),
  ADD CONSTRAINT chk_transactions_type CHECK (type IN ('income', 'expense', 'transfer')),
  ADD CONSTRAINT chk_transactions_payment_method CHECK (payment_method IN ('cash', 'online')),
  ADD CONSTRAINT chk_transactions_vendor_length CHECK (char_length(vendor) <= 200),
  ADD CONSTRAINT chk_transactions_title_length CHECK (title IS NULL OR char_length(title) <= 200),
  ADD CONSTRAINT chk_transactions_notes_length CHECK (notes IS NULL OR char_length(notes) <= 1000);

ALTER TABLE public.categories
  ADD CONSTRAINT chk_categories_name_length CHECK (char_length(name) <= 100),
  ADD CONSTRAINT chk_categories_type CHECK (type IN ('income', 'expense'));

ALTER TABLE public.vendors
  ADD CONSTRAINT chk_vendors_name_length CHECK (char_length(name) <= 200);

ALTER TABLE public.projects
  ADD CONSTRAINT chk_projects_name_length CHECK (char_length(name) <= 200),
  ADD CONSTRAINT chk_projects_budget_limit CHECK (budget_limit >= 0),
  ADD CONSTRAINT chk_projects_margin CHECK (margin >= 0);

ALTER TABLE public.partners
  ADD CONSTRAINT chk_partners_name_length CHECK (char_length(name) <= 200);

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_name_length CHECK (char_length(name) <= 200);

ALTER TABLE public.notifications
  ADD CONSTRAINT chk_notifications_title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT chk_notifications_message_length CHECK (char_length(message) <= 1000);

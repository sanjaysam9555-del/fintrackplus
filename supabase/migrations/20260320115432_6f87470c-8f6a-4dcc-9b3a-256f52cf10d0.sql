
-- 1. Add 'handled_by' column (stores auth user_id directly)
ALTER TABLE public.transactions ADD COLUMN handled_by uuid;

-- 2. Migrate existing data: map partner_id → partners.user_id
UPDATE public.transactions t
SET handled_by = p.user_id
FROM public.partners p
WHERE t.partner_id = p.id;

-- 3. Add 'role' column to partners
ALTER TABLE public.partners ADD COLUMN role text DEFAULT 'owner';

-- 4. Populate role from org_members
UPDATE public.partners p
SET role = om.role::text
FROM public.org_members om
WHERE p.user_id = om.user_id AND om.status = 'active';

-- 5. Drop old FK and partner_id column
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_partner_id_fkey;
ALTER TABLE public.transactions DROP COLUMN partner_id;

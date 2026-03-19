
-- Step 1: Create enums
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'employee');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Step 2: Create organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Organization',
  owner_id uuid NOT NULL,
  max_members int NOT NULL DEFAULT 3,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Step 3: Create org_members table
CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'employee',
  must_change_password boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Step 4: Create change_approvals table
CREATE TABLE public.change_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  proposed_changes jsonb NOT NULL DEFAULT '{}',
  status public.approval_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);
ALTER TABLE public.change_approvals ENABLE ROW LEVEL SECURITY;

-- Step 5: Add org_id to all data tables (nullable first for backfill)
ALTER TABLE public.transactions ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.vendors ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.partners ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.project_labels ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.project_documents ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Step 6: Add assigned_employee_ids to projects
ALTER TABLE public.projects ADD COLUMN assigned_employee_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Step 7: Create security definer functions (CRITICAL: avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.org_members WHERE user_id = _user_id AND status = 'active' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.org_members WHERE user_id = _user_id AND status = 'active' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_partner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id FROM public.partners p
  INNER JOIN public.org_members om ON om.org_id = p.org_id
  WHERE om.user_id = _user_id AND om.role = 'owner' AND om.status = 'active'
  AND p.user_id = _user_id
  LIMIT 1;
$$;

-- Step 8: Backfill existing users — create orgs and org_members for each existing user
DO $$
DECLARE
  r RECORD;
  new_org_id uuid;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.profiles LOOP
    -- Create org for each existing user
    INSERT INTO public.organizations (id, name, owner_id)
    VALUES (gen_random_uuid(), 'My Organization', r.user_id)
    RETURNING id INTO new_org_id;
    
    -- Create org_member as owner
    INSERT INTO public.org_members (org_id, user_id, role, must_change_password, status)
    VALUES (new_org_id, r.user_id, 'owner', false, 'active');
    
    -- Backfill org_id on all data tables for this user
    UPDATE public.transactions SET org_id = new_org_id WHERE user_id = r.user_id;
    UPDATE public.categories SET org_id = new_org_id WHERE user_id = r.user_id;
    UPDATE public.vendors SET org_id = new_org_id WHERE user_id = r.user_id;
    UPDATE public.projects SET org_id = new_org_id WHERE user_id = r.user_id;
    UPDATE public.partners SET org_id = new_org_id WHERE user_id = r.user_id;
    UPDATE public.project_labels SET org_id = new_org_id WHERE user_id = r.user_id;
    UPDATE public.project_documents SET org_id = new_org_id WHERE user_id = r.user_id;
    UPDATE public.notifications SET org_id = new_org_id WHERE user_id = r.user_id;
    UPDATE public.profiles SET org_id = new_org_id WHERE user_id = r.user_id;
  END LOOP;
END $$;

-- Step 9: Update handle_new_user trigger function to auto-create org + org_member + partner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_org_id uuid;
  invite_org_id uuid;
  invite_role public.app_role;
BEGIN
  -- Check if this user was pre-created via manage-team (org_member already exists)
  SELECT om.org_id, om.role INTO invite_org_id, invite_role
  FROM public.org_members om WHERE om.user_id = NEW.id LIMIT 1;
  
  IF invite_org_id IS NOT NULL THEN
    -- User was invited — create profile with the org's org_id
    INSERT INTO public.profiles (user_id, name, org_id)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), invite_org_id);
    RETURN NEW;
  END IF;
  
  -- Normal signup — create org, org_member (owner), partner, and profile
  INSERT INTO public.organizations (name, owner_id)
  VALUES ('My Organization', NEW.id)
  RETURNING id INTO new_org_id;
  
  INSERT INTO public.org_members (org_id, user_id, role, must_change_password, status)
  VALUES (new_org_id, NEW.id, 'owner', false, 'active');
  
  INSERT INTO public.profiles (user_id, name, org_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), new_org_id);
  
  -- Auto-create partner for the owner
  INSERT INTO public.partners (user_id, name, org_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Owner'), new_org_id);
  
  RETURN NEW;
END;
$function$;

-- Step 10: RLS policies for organizations
CREATE POLICY "Org members can view their org"
  ON public.organizations FOR SELECT TO authenticated
  USING (id = public.get_user_org_id(auth.uid()));

-- Step 11: RLS policies for org_members
CREATE POLICY "Org members can view their org members"
  ON public.org_members FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Owners can insert org members"
  ON public.org_members FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'owner');

CREATE POLICY "Owners can update org members"
  ON public.org_members FOR UPDATE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'owner');

CREATE POLICY "Owners can delete org members"
  ON public.org_members FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'owner');

-- Step 12: RLS policies for change_approvals
CREATE POLICY "Org members can view their change approvals"
  ON public.change_approvals FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Owners can create change approvals"
  ON public.change_approvals FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'owner');

CREATE POLICY "Target user can update change approvals"
  ON public.change_approvals FOR UPDATE TO authenticated
  USING (target_user_id = auth.uid() AND org_id = public.get_user_org_id(auth.uid()));

-- Step 13: Replace ALL existing RLS policies on data tables with org-scoped ones

-- TRANSACTIONS
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Org members can view transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Owners and admins can insert transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update transactions"
  ON public.transactions FOR UPDATE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can delete transactions"
  ON public.transactions FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

-- CATEGORIES
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Org members can view categories"
  ON public.categories FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Owners and admins can insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

-- VENDORS
DROP POLICY IF EXISTS "Users can view their own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can create their own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can update their own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can delete their own vendors" ON public.vendors;

CREATE POLICY "Org members can view vendors"
  ON public.vendors FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Owners and admins can insert vendors"
  ON public.vendors FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update vendors"
  ON public.vendors FOR UPDATE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can delete vendors"
  ON public.vendors FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

-- PROJECTS
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

CREATE POLICY "Org members can view projects"
  ON public.projects FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Owners and admins can insert projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can delete projects"
  ON public.projects FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

-- PARTNERS
DROP POLICY IF EXISTS "Users can view their own partners" ON public.partners;
DROP POLICY IF EXISTS "Users can create their own partners" ON public.partners;
DROP POLICY IF EXISTS "Users can update their own partners" ON public.partners;
DROP POLICY IF EXISTS "Users can delete their own partners" ON public.partners;

CREATE POLICY "Org members can view partners"
  ON public.partners FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Owners can insert partners"
  ON public.partners FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'owner');

CREATE POLICY "Owners can update partners"
  ON public.partners FOR UPDATE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'owner');

CREATE POLICY "Owners can delete partners"
  ON public.partners FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'owner');

-- PROJECT_LABELS
DROP POLICY IF EXISTS "Users can view their own project_labels" ON public.project_labels;
DROP POLICY IF EXISTS "Users can create their own project_labels" ON public.project_labels;
DROP POLICY IF EXISTS "Users can update their own project_labels" ON public.project_labels;
DROP POLICY IF EXISTS "Users can delete their own project_labels" ON public.project_labels;

CREATE POLICY "Org members can view project_labels"
  ON public.project_labels FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Owners and admins can insert project_labels"
  ON public.project_labels FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update project_labels"
  ON public.project_labels FOR UPDATE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can delete project_labels"
  ON public.project_labels FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

-- PROJECT_DOCUMENTS
DROP POLICY IF EXISTS "Users can view their own project documents" ON public.project_documents;
DROP POLICY IF EXISTS "Users can create their own project documents" ON public.project_documents;
DROP POLICY IF EXISTS "Users can delete their own project documents" ON public.project_documents;

CREATE POLICY "Org members can view project documents"
  ON public.project_documents FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Owners and admins can insert project documents"
  ON public.project_documents FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can delete project documents"
  ON public.project_documents FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('owner', 'admin'));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Org members can view notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

-- PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Org members can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

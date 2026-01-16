-- Add margin column to projects table
ALTER TABLE public.projects 
ADD COLUMN margin numeric NOT NULL DEFAULT 0;
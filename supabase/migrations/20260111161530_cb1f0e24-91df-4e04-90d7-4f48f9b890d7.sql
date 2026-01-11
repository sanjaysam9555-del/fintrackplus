-- Add title column to transactions table for naming expenses/income
ALTER TABLE public.transactions ADD COLUMN title TEXT;
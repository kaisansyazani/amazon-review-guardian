-- Add product_name column to analysis_results table
ALTER TABLE public.analysis_results 
ADD COLUMN product_name TEXT;
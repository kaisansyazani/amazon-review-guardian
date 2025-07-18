
-- Add DELETE policy for analysis_results table to allow public deletion
-- This matches the existing public access pattern for this table
CREATE POLICY "Analysis results are publicly deletable" 
ON public.analysis_results 
FOR DELETE 
USING (true);

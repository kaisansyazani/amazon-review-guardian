-- Allow the edge function to insert analysis results
-- Since this is a public analysis tool, we'll allow inserts from the service role
CREATE POLICY "Allow service role to insert analysis results" 
ON public.analysis_results 
FOR INSERT 
WITH CHECK (true);

-- Also allow updates in case we want to refresh cached data
CREATE POLICY "Allow service role to update analysis results" 
ON public.analysis_results 
FOR UPDATE 
USING (true);
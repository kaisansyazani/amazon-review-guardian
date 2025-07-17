-- Create a table to store analysis results
CREATE TABLE public.analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asin TEXT NOT NULL,
  overall_trust INTEGER NOT NULL,
  total_reviews INTEGER NOT NULL,
  analyzed_reviews JSONB NOT NULL,
  insights TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since this is a public tool)
CREATE POLICY "Analysis results are publicly readable" 
ON public.analysis_results 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_analysis_results_updated_at
BEFORE UPDATE ON public.analysis_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
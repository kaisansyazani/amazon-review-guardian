-- Enhanced Review Analysis Schema Updates
-- Add sentiment analysis fields
ALTER TABLE public.analysis_results 
ADD COLUMN sentiment_score DECIMAL(3,2), -- Overall sentiment score -1 to 1
ADD COLUMN sentiment_distribution JSONB, -- Distribution of positive/negative/neutral
ADD COLUMN emotion_scores JSONB; -- Detailed emotion analysis

-- Add topic and keyword extraction fields  
ALTER TABLE public.analysis_results
ADD COLUMN topics JSONB, -- Extracted topics/themes
ADD COLUMN keywords TEXT[], -- Key phrases and words
ADD COLUMN product_aspects JSONB; -- Specific product features mentioned

-- Add AI-generated summaries
ALTER TABLE public.analysis_results
ADD COLUMN summary_positive TEXT, -- What customers love
ADD COLUMN summary_negative TEXT, -- Common complaints  
ADD COLUMN summary_overall TEXT, -- Overall impression
ADD COLUMN recommendation TEXT; -- AI buying recommendation
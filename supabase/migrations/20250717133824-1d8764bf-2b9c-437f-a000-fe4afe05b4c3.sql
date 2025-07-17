
-- Create table for Q&A questions about detecting fake reviews
CREATE TABLE public.qa_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of 4 possible answers
  correct_answer INTEGER NOT NULL, -- Index of correct answer (0-3)
  explanation TEXT NOT NULL,
  difficulty_level TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'sentiment', 'patterns', 'technical', 'behavioral')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user quiz sessions
CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  questions_answered JSONB NOT NULL DEFAULT '[]', -- Array of question IDs and user answers
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 10,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for qa_questions (publicly readable)
CREATE POLICY "QA questions are publicly readable" 
  ON public.qa_questions 
  FOR SELECT 
  USING (true);

-- RLS policies for quiz_sessions (users can only see their own sessions)
CREATE POLICY "Users can view their own quiz sessions" 
  ON public.quiz_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create quiz sessions" 
  ON public.quiz_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own quiz sessions" 
  ON public.quiz_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_qa_questions_updated_at
  BEFORE UPDATE ON public.qa_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial questions about detecting fake reviews
INSERT INTO public.qa_questions (question, options, correct_answer, explanation, difficulty_level, category) VALUES
('What is a common sign of a fake review?', 
 '["Generic language with no specific details", "Mentions specific product features", "Includes photos of the product", "Written in proper grammar"]', 
 0, 
 'Fake reviews often use generic language and avoid specific details about the product because the reviewer hasn''t actually used it.',
 'easy', 'general'),

('Which review pattern suggests manipulation?', 
 '["Reviews spread over several months", "Multiple 5-star reviews posted on the same day", "Reviews with different writing styles", "Reviews mentioning pros and cons"]', 
 1, 
 'Multiple reviews posted simultaneously, especially all 5-star ratings, often indicates review manipulation or bot activity.',
 'medium', 'patterns'),

('What should you look for in a reviewer''s profile?', 
 '["High number of followers", "Reviews only 5-star products", "Detailed bio information", "Active for many years"]', 
 1, 
 'Reviewers who only give 5-star reviews across all products are suspicious and likely fake accounts.',
 'medium', 'behavioral'),

('Which sentiment analysis red flag indicates fake reviews?', 
 '["Mixed emotions in reviews", "Overly positive language in all reviews", "Negative reviews with constructive feedback", "Balanced pros and cons"]', 
 1, 
 'When all reviews use extremely positive language without any criticism, it suggests artificial or paid reviews.',
 'hard', 'sentiment'),

('What technical indicator can reveal fake reviews?', 
 '["Reviews from verified purchases", "Similar IP addresses for multiple reviews", "Reviews with different timestamps", "Reviews in multiple languages"]', 
 1, 
 'Multiple reviews from similar IP addresses or locations can indicate coordinated fake review campaigns.',
 'hard', 'technical');

-- Create web_results table for TopicMingle
CREATE TABLE IF NOT EXISTS public.web_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_url TEXT NOT NULL,
  page_number INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_sponsored BOOLEAN DEFAULT false,
  pre_landing_page_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.web_results ENABLE ROW LEVEL SECURITY;

-- Anyone can view active web results
CREATE POLICY "Anyone can view active web results" 
ON public.web_results 
FOR SELECT 
USING (is_active = true);

-- Service role can manage web results
CREATE POLICY "Service role can manage web results" 
ON public.web_results 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_web_results_updated_at
BEFORE UPDATE ON public.web_results
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
-- Create related_searches table for managing search suggestions
CREATE TABLE public.related_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  search_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.related_searches ENABLE ROW LEVEL SECURITY;

-- Create policies for related searches
CREATE POLICY "Anyone can view active related searches"
  ON public.related_searches
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage related searches"
  ON public.related_searches
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_related_searches_category ON public.related_searches(category_id, display_order) WHERE is_active = true;
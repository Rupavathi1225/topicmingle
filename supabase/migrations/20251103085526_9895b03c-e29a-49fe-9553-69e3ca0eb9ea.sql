-- Add country and source tracking to sessions
ALTER TABLE public.sessions
ADD COLUMN country TEXT,
ADD COLUMN source TEXT;

-- Add country restrictions to related searches
ALTER TABLE public.related_searches
ADD COLUMN allowed_countries TEXT[] DEFAULT ARRAY['WW']::TEXT[];

-- Add country and source to clicks for better tracking
ALTER TABLE public.clicks
ADD COLUMN country TEXT,
ADD COLUMN source TEXT;

-- Add country and source to page_views
ALTER TABLE public.page_views
ADD COLUMN country TEXT,
ADD COLUMN source TEXT;

-- Create index for country-based queries
CREATE INDEX idx_sessions_country ON public.sessions(country);
CREATE INDEX idx_clicks_country ON public.clicks(country);
CREATE INDEX idx_page_views_country ON public.page_views(country);
CREATE INDEX idx_related_searches_countries ON public.related_searches USING GIN(allowed_countries);
-- Create tracking tables for analytics

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Clicks table
CREATE TABLE IF NOT EXISTS public.clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  button_id TEXT NOT NULL,
  button_label TEXT,
  page_url TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

-- Page views table
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  blog_id UUID,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since these are anonymous tracking)
CREATE POLICY "Anyone can insert sessions"
ON public.sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
ON public.sessions
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can insert clicks"
ON public.clicks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can manage sessions"
ON public.sessions
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage clicks"
ON public.clicks
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage page views"
ON public.page_views
FOR ALL
USING (true)
WITH CHECK (true);
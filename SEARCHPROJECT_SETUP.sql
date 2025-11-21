-- Run this SQL in your SearchProject Supabase database
-- https://svsrtuvekdvgfaadmtzj.supabase.co

-- Drop existing tables if they exist (CAUTION: This will delete all data!)
DROP TABLE IF EXISTS public.email_captures CASCADE;
DROP TABLE IF EXISTS public.web_results CASCADE;
DROP TABLE IF EXISTS public.related_searches CASCADE;
DROP TABLE IF EXISTS public.pre_landing_pages CASCADE;

-- Web Results table
CREATE TABLE public.web_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NULL,
  logo_url text NULL,
  target_url text NOT NULL,
  page_number integer NOT NULL DEFAULT 1,
  position integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  is_sponsored boolean NULL DEFAULT false,
  pre_landing_page_key text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT web_results_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_web_results_page ON public.web_results USING btree (page_number);
CREATE INDEX idx_web_results_active ON public.web_results USING btree (is_active);

-- Related Searches table
CREATE TABLE public.related_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id integer NULL,
  search_text text NOT NULL,
  title text NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  web_result_page integer NULL DEFAULT 1,
  position integer NULL DEFAULT 1,
  pre_landing_page_key text NULL,
  allowed_countries text[] NULL DEFAULT ARRAY['WW'::text],
  session_id text NULL,
  ip_address text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT related_searches_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_related_searches_active ON public.related_searches USING btree (is_active);
CREATE INDEX idx_related_searches_page ON public.related_searches USING btree (web_result_page);

-- Pre-landing Pages table
CREATE TABLE public.pre_landing_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  headline text NOT NULL,
  description text NULL,
  logo_url text NULL,
  logo_position text NULL DEFAULT 'top-center'::text,
  logo_width integer NULL DEFAULT 150,
  main_image_url text NULL,
  image_ratio text NULL DEFAULT '16:9'::text,
  headline_font_size integer NULL DEFAULT 32,
  headline_color text NULL DEFAULT '#000000'::text,
  headline_align text NULL DEFAULT 'center'::text,
  description_font_size integer NULL DEFAULT 16,
  description_color text NULL DEFAULT '#333333'::text,
  description_align text NULL DEFAULT 'center'::text,
  cta_text text NULL DEFAULT 'Get Started'::text,
  cta_color text NULL DEFAULT '#10b981'::text,
  background_color text NULL DEFAULT '#ffffff'::text,
  background_image_url text NULL,
  target_url text NOT NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT pre_landing_pages_pkey PRIMARY KEY (id),
  CONSTRAINT pre_landing_pages_page_key_key UNIQUE (page_key)
);

CREATE INDEX idx_pre_landing_pages_active ON public.pre_landing_pages USING btree (is_active);
CREATE INDEX idx_pre_landing_pages_key ON public.pre_landing_pages USING btree (page_key);

-- Email Captures table
CREATE TABLE public.email_captures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  page_key text NOT NULL,
  source text NULL,
  country text NULL,
  captured_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT email_captures_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_email_captures_page ON public.email_captures USING btree (page_key);
CREATE INDEX idx_email_captures_date ON public.email_captures USING btree (captured_at DESC);

-- Enable Row Level Security
ALTER TABLE public.web_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Anyone can view active web results" 
  ON public.web_results FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Anyone can view active related searches" 
  ON public.related_searches FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Anyone can view active landing pages" 
  ON public.pre_landing_pages FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Anyone can insert email captures" 
  ON public.email_captures FOR INSERT 
  WITH CHECK (true);

-- Service role policies for full access
CREATE POLICY "Service role can manage web results" 
  ON public.web_results FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage related searches" 
  ON public.related_searches FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage landing pages" 
  ON public.pre_landing_pages FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage email captures" 
  ON public.email_captures FOR ALL 
  USING (true) WITH CHECK (true);

-- Done! Now the SearchProject database matches the main project structure.
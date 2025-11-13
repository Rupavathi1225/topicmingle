-- Run this SQL in your DataOrbitZone Supabase database
-- https://xajelbbeohalbckziwiq.supabase.co

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id serial NOT NULL,
  name text NOT NULL,
  code_range text NOT NULL,
  slug text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_slug_key UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories USING btree (slug);

-- Blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  serial_number integer NULL,
  title text NOT NULL,
  slug text NOT NULL,
  category_id integer NULL,
  author text NOT NULL,
  author_bio text NULL,
  author_image text NULL,
  content text NOT NULL,
  featured_image text NULL,
  published_at timestamp with time zone NULL DEFAULT now(),
  status text NULL DEFAULT 'published'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT blogs_pkey PRIMARY KEY (id),
  CONSTRAINT blogs_slug_key UNIQUE (slug),
  CONSTRAINT blogs_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE INDEX IF NOT EXISTS idx_blogs_category ON public.blogs USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs USING btree (status);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON public.blogs USING btree (published_at DESC);

-- Related searches table
CREATE TABLE IF NOT EXISTS public.related_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  blog_id uuid NULL,
  search_text text NOT NULL,
  target_url text NOT NULL,
  display_order integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT related_searches_pkey PRIMARY KEY (id),
  CONSTRAINT related_searches_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_related_searches_blog ON public.related_searches USING btree (blog_id);

-- Prelanding pages table
CREATE TABLE IF NOT EXISTS public.prelanding_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  related_search_id uuid NOT NULL,
  logo_url text NULL,
  logo_position text NULL DEFAULT 'top-center'::text,
  logo_size integer NULL DEFAULT 100,
  main_image_url text NULL,
  image_ratio text NULL DEFAULT '16:9'::text,
  headline text NULL DEFAULT 'Welcome'::text,
  description text NULL DEFAULT 'Check out this amazing resource'::text,
  headline_font_size integer NULL DEFAULT 32,
  headline_color text NULL DEFAULT '#000000'::text,
  description_font_size integer NULL DEFAULT 16,
  description_color text NULL DEFAULT '#666666'::text,
  text_alignment text NULL DEFAULT 'center'::text,
  email_box_color text NULL DEFAULT '#ffffff'::text,
  email_box_border_color text NULL DEFAULT '#cccccc'::text,
  button_text text NULL DEFAULT 'Continue'::text,
  button_color text NULL DEFAULT '#1a2942'::text,
  button_text_color text NULL DEFAULT '#ffffff'::text,
  background_color text NULL DEFAULT '#ffffff'::text,
  background_image_url text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT prelanding_pages_pkey PRIMARY KEY (id),
  CONSTRAINT prelanding_pages_related_search_id_key UNIQUE (related_search_id)
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prelanding_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read published blogs" ON public.blogs FOR SELECT USING (status = 'published');
CREATE POLICY "Anyone can read related searches" ON public.related_searches FOR SELECT USING (true);
CREATE POLICY "Anyone can read prelanding pages" ON public.prelanding_pages FOR SELECT USING (true);

-- Service role policies for full access (use service role key for admin operations)
CREATE POLICY "Service role can manage categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage blogs" ON public.blogs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage related searches" ON public.related_searches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage prelanding pages" ON public.prelanding_pages FOR ALL USING (true) WITH CHECK (true);

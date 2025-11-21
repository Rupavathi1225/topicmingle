-- Create pre_landing_pages table for all three projects
CREATE TABLE IF NOT EXISTS public.pre_landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text UNIQUE NOT NULL,
  logo_url text,
  logo_position text DEFAULT 'top-center',
  logo_width integer DEFAULT 150,
  main_image_url text,
  image_ratio text DEFAULT '16:9',
  headline text NOT NULL,
  description text,
  headline_font_size integer DEFAULT 32,
  headline_color text DEFAULT '#000000',
  headline_align text DEFAULT 'center',
  description_font_size integer DEFAULT 16,
  description_color text DEFAULT '#333333',
  description_align text DEFAULT 'center',
  cta_text text DEFAULT 'Get Started',
  cta_color text DEFAULT '#10b981',
  background_color text DEFAULT '#ffffff',
  background_image_url text,
  target_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_captures table
CREATE TABLE IF NOT EXISTS public.email_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  page_key text NOT NULL,
  source text,
  country text,
  captured_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_pre_landing_pages_key ON public.pre_landing_pages(page_key);
CREATE INDEX IF NOT EXISTS idx_email_captures_page ON public.email_captures(page_key);
CREATE INDEX IF NOT EXISTS idx_email_captures_date ON public.email_captures(captured_at);

-- Enable RLS
ALTER TABLE public.pre_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pre_landing_pages
CREATE POLICY "Anyone can view active landing pages"
  ON public.pre_landing_pages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage landing pages"
  ON public.pre_landing_pages FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for email_captures
CREATE POLICY "Anyone can insert email captures"
  ON public.email_captures FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage email captures"
  ON public.email_captures FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_pre_landing_pages_updated_at
  BEFORE UPDATE ON public.pre_landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update related_searches table to include page assignment and pre-landing page
ALTER TABLE public.related_searches 
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS web_result_page integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS position integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pre_landing_page_key text;
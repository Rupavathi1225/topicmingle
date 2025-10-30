-- Create categories table
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code_range TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blogs table
CREATE TABLE public.blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Public read access for categories
CREATE POLICY "Anyone can read categories"
  ON public.categories
  FOR SELECT
  USING (true);

-- Public read access for published blogs
CREATE POLICY "Anyone can read published blogs"
  ON public.blogs
  FOR SELECT
  USING (status = 'published');

-- Admin policies (for now, allow all operations - in production you'd add auth)
CREATE POLICY "Service role can manage categories"
  ON public.categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage blogs"
  ON public.blogs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default categories
INSERT INTO public.categories (name, code_range, slug) VALUES
  ('Finance', '100-200', 'finance'),
  ('Education', '201-300', 'education'),
  ('Travel', '301-400', 'travel'),
  ('Health', '401-500', 'health'),
  ('Tech', '501-600', 'tech'),
  ('Lifestyle', '601-700', 'lifestyle');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for blogs
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
-- Add session tracking columns to related_searches table
ALTER TABLE public.related_searches
ADD COLUMN session_id text,
ADD COLUMN ip_address text;

-- Create index for session-based queries
CREATE INDEX idx_related_searches_session ON public.related_searches(session_id);

-- Create index for IP-based queries
CREATE INDEX idx_related_searches_ip ON public.related_searches(ip_address);
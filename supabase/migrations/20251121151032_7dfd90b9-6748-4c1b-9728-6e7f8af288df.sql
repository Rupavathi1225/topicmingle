-- Add logo_url to web_results table
ALTER TABLE web_results ADD COLUMN IF NOT EXISTS logo_url TEXT;
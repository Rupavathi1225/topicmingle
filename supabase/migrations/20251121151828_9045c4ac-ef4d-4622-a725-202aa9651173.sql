-- Make category_id nullable for related_searches to support project-level searches
ALTER TABLE related_searches ALTER COLUMN category_id DROP NOT NULL;

-- Add a default value for category_id
ALTER TABLE related_searches ALTER COLUMN category_id SET DEFAULT 1;
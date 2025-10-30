-- Add serial_number column to blogs table
ALTER TABLE public.blogs 
ADD COLUMN serial_number SERIAL;

-- Create a sequence for serial numbers
CREATE SEQUENCE IF NOT EXISTS blogs_serial_seq START 1;

-- Update existing blogs with serial numbers based on creation date
WITH numbered_blogs AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM public.blogs
)
UPDATE public.blogs 
SET serial_number = numbered_blogs.row_num
FROM numbered_blogs
WHERE blogs.id = numbered_blogs.id;

-- Set the sequence to continue from the highest serial number
SELECT setval('blogs_serial_seq', COALESCE((SELECT MAX(serial_number) FROM public.blogs), 0) + 1, false);
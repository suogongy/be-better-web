-- Create exports bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  true,  -- public bucket
  52428800,  -- 50MB limit
  ARRAY['application/json', 'text/csv', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the exports bucket
CREATE POLICY "Public access to exports" ON storage.objects
FOR SELECT USING (bucket_id = 'exports');

CREATE POLICY "Users can upload their own exports" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'exports' AND
  storage.foldername(name)[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own exports" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'exports' AND
  storage.foldername(name)[1] = auth.uid()::text
);

-- Update data_exports table to include additional fields
ALTER TABLE data_exports 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_data_exports_user_status 
ON data_exports(user_id, status);

CREATE INDEX IF NOT EXISTS idx_data_exports_created_at 
ON data_exports(created_at);
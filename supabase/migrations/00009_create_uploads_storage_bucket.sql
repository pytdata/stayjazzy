-- Create the uploads storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  10485760,   -- 10 MB hard cap at bucket level
  ARRAY[
    'image/jpeg','image/png','image/gif','image/webp','image/avif',
    'video/mp4','video/webm','video/ogg','video/quicktime'
  ]
);

-- Anyone can read (public bucket)
CREATE POLICY "uploads_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

-- Only authenticated (admin) can upload/update/delete
CREATE POLICY "uploads_admin_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "uploads_admin_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'uploads');

CREATE POLICY "uploads_admin_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'uploads');
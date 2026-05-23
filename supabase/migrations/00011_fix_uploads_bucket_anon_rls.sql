-- The admin portal uses custom auth (not Supabase Auth), so the Supabase
-- client always carries the anon role. We must permit anon INSERT/UPDATE/DELETE
-- on the uploads bucket so MediaUpload works from the admin panel.

-- Allow anon to upload
CREATE POLICY "uploads_anon_insert" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'uploads');

-- Allow anon to update (replace)
CREATE POLICY "uploads_anon_update" ON storage.objects
  FOR UPDATE TO anon USING (bucket_id = 'uploads');

-- Allow anon to delete (remove)
CREATE POLICY "uploads_anon_delete" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'uploads');
DROP POLICY IF EXISTS "media bucket public read" ON storage.objects;
CREATE POLICY "media bucket authenticated read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media');
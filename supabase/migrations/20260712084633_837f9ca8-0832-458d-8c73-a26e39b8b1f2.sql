
CREATE POLICY "media bucket public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media');
CREATE POLICY "media bucket public insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'media');

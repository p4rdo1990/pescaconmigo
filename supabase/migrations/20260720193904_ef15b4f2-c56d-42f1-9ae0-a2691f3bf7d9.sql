
-- Restrict media SELECT to authenticated users
DROP POLICY IF EXISTS "media readable by all" ON public.media;
REVOKE SELECT ON public.media FROM anon;
CREATE POLICY "media readable by authenticated" ON public.media
  FOR SELECT TO authenticated USING (true);

-- Restrict messages SELECT to authenticated users
DROP POLICY IF EXISTS "messages readable by all" ON public.messages;
REVOKE SELECT ON public.messages FROM anon;
CREATE POLICY "messages readable by authenticated" ON public.messages
  FOR SELECT TO authenticated USING (true);

-- Add owner-scoped UPDATE/DELETE policies on media storage bucket
CREATE POLICY "media owners can update their files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'media' AND auth.uid() = owner);

CREATE POLICY "media owners can delete their files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND auth.uid() = owner);

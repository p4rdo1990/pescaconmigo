
-- Add user_id ownership columns
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Replace permissive insert policies on media
DROP POLICY IF EXISTS "media insertable by all" ON public.media;
CREATE POLICY "media insertable by authenticated owners"
  ON public.media FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Remove anon insert grant
REVOKE INSERT ON public.media FROM anon;
REVOKE DELETE ON public.media FROM anon, authenticated;

-- Replace permissive insert policies on messages
DROP POLICY IF EXISTS "messages insertable by all" ON public.messages;
CREATE POLICY "messages insertable by authenticated authors"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

REVOKE INSERT ON public.messages FROM anon;

-- Storage bucket: restrict inserts to authenticated users, keep public read
DROP POLICY IF EXISTS "media bucket public insert" ON storage.objects;
CREATE POLICY "media bucket authenticated insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND auth.uid() = owner);

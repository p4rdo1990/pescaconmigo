
-- Media table: allow public read + insert
DROP POLICY IF EXISTS "media readable by authenticated" ON public.media;
DROP POLICY IF EXISTS "media insertable by authenticated owners" ON public.media;
GRANT SELECT, INSERT ON public.media TO anon;
CREATE POLICY "media public read" ON public.media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "media public insert" ON public.media FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Messages table: allow public read + insert
DROP POLICY IF EXISTS "messages readable by authenticated" ON public.messages;
DROP POLICY IF EXISTS "messages insertable by authenticated authors" ON public.messages;
GRANT SELECT, INSERT ON public.messages TO anon;
CREATE POLICY "messages public read" ON public.messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "messages public insert" ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Storage: allow public read + insert on media bucket
DROP POLICY IF EXISTS "media bucket authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "media bucket authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "media bucket owner update" ON storage.objects;
DROP POLICY IF EXISTS "media bucket owner delete" ON storage.objects;
CREATE POLICY "media bucket public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media');
CREATE POLICY "media bucket public insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'media');

-- Live streams table
CREATE TABLE public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_live BOOLEAN NOT NULL DEFAULT true,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_streams TO anon, authenticated;
GRANT ALL ON public.live_streams TO service_role;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live public read" ON public.live_streams FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "live public insert" ON public.live_streams FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "live public update" ON public.live_streams FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;

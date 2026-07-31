CREATE TABLE public.live_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  storage_path TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.live_replays TO anon, authenticated;
GRANT ALL ON public.live_replays TO service_role;

ALTER TABLE public.live_replays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live replays readable by all"
  ON public.live_replays FOR SELECT TO anon, authenticated USING (true);

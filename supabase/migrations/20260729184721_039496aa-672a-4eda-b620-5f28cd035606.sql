-- Remove permissive write policies on tables
DROP POLICY IF EXISTS "media public insert" ON public.media;
DROP POLICY IF EXISTS "messages public insert" ON public.messages;
DROP POLICY IF EXISTS "live public insert" ON public.live_streams;
DROP POLICY IF EXISTS "live public update" ON public.live_streams;

-- Revoke write privileges from public roles (writes go through server functions using the service role)
REVOKE INSERT, UPDATE, DELETE ON public.media FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.messages FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.live_streams FROM anon, authenticated;

GRANT SELECT ON public.media TO anon, authenticated;
GRANT SELECT ON public.messages TO anon, authenticated;
GRANT SELECT ON public.live_streams TO anon, authenticated;
GRANT ALL ON public.media TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.live_streams TO service_role;

-- Storage: remove permissive object policies for the private media bucket
DROP POLICY IF EXISTS "media bucket public insert" ON storage.objects;
DROP POLICY IF EXISTS "media bucket public read" ON storage.objects;
DROP POLICY IF EXISTS "media bucket public update" ON storage.objects;
DROP POLICY IF EXISTS "media bucket public delete" ON storage.objects;
DROP POLICY IF EXISTS "media bucket owner update" ON storage.objects;
DROP POLICY IF EXISTS "media bucket owner delete" ON storage.objects;
DROP POLICY IF EXISTS "media bucket authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "media bucket authenticated insert" ON storage.objects;
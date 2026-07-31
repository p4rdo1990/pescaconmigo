CREATE TABLE public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL CHECK (char_length(first_name) BETWEEN 2 AND 40),
  last_name TEXT NOT NULL CHECK (char_length(last_name) BETWEEN 2 AND 80),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 9 AND 20),
  booking_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX booking_requests_date_idx ON public.booking_requests (booking_date);

GRANT ALL ON public.booking_requests TO service_role;

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

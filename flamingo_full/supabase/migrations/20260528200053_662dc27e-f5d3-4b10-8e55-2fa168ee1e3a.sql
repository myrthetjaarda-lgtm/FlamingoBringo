CREATE TABLE public.rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'coming',
  relationship_label TEXT,
  arrival_time TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rsvps TO authenticated;
GRANT ALL ON public.rsvps TO service_role;

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view rsvps"
ON public.rsvps FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users insert own rsvp"
ON public.rsvps FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own rsvp"
ON public.rsvps FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own rsvp"
ON public.rsvps FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER touch_rsvps_updated_at
BEFORE UPDATE ON public.rsvps
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.rsvps;
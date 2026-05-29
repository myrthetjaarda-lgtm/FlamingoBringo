-- Suggested date options for an event
CREATE TABLE public.date_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  option_date DATE NOT NULL,
  time_label TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.date_options TO authenticated;
GRANT ALL ON public.date_options TO service_role;

ALTER TABLE public.date_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view date options"
ON public.date_options FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Organizer or attendee can add date options"
ON public.date_options FOR INSERT TO authenticated
WITH CHECK (is_event_organizer(event_id) OR (created_by = auth.uid()));

CREATE POLICY "Organizer or creator can delete date options"
ON public.date_options FOR DELETE TO authenticated
USING (is_event_organizer(event_id) OR (created_by = auth.uid()));

-- Availability votes
CREATE TABLE public.date_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id UUID NOT NULL REFERENCES public.date_options(id) ON DELETE CASCADE,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  availability TEXT NOT NULL DEFAULT 'yes',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (option_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.date_votes TO authenticated;
GRANT ALL ON public.date_votes TO service_role;

ALTER TABLE public.date_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view date votes"
ON public.date_votes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users insert own date vote"
ON public.date_votes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own date vote"
ON public.date_votes FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own date vote"
ON public.date_votes FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE TRIGGER touch_date_votes_updated_at
BEFORE UPDATE ON public.date_votes
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_date_options_event ON public.date_options(event_id);
CREATE INDEX idx_date_votes_option ON public.date_votes(option_id);
CREATE INDEX idx_date_votes_event ON public.date_votes(event_id);
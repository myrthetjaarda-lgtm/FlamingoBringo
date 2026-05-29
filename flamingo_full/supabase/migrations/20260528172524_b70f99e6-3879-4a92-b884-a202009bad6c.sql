
CREATE OR REPLACE FUNCTION public.is_event_organizer(_event_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events WHERE id = _event_id AND organizer_id = auth.uid()
  );
$$;


-- Extend profiles with contact + preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS default_location TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS dietary TEXT[] NOT NULL DEFAULT '{}';

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ,
  location TEXT,
  prizes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view events" ON public.events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizer can update event" ON public.events
  FOR UPDATE TO authenticated USING (auth.uid() = organizer_id);

CREATE POLICY "Organizer can delete event" ON public.events
  FOR DELETE TO authenticated USING (auth.uid() = organizer_id);

CREATE TRIGGER events_touch
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Bring items
CREATE TABLE public.bring_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🧺',
  quantity TEXT,
  ingredients TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  claimed_by UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bring_items_event_idx ON public.bring_items(event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bring_items TO authenticated;
GRANT ALL ON public.bring_items TO service_role;

ALTER TABLE public.bring_items ENABLE ROW LEVEL SECURITY;

-- Helper: is current user the organizer?
CREATE OR REPLACE FUNCTION public.is_event_organizer(_event_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events WHERE id = _event_id AND organizer_id = auth.uid()
  );
$$;

CREATE POLICY "Authenticated can view bring items" ON public.bring_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Organizer can add bring items" ON public.bring_items
  FOR INSERT TO authenticated
  WITH CHECK (public.is_event_organizer(event_id));

-- Update allowed when: organizer, OR user is claiming an unclaimed item for themselves,
-- OR user is unclaiming their own item.
CREATE POLICY "Organizer or claimer can update" ON public.bring_items
  FOR UPDATE TO authenticated
  USING (
    public.is_event_organizer(event_id)
    OR claimed_by IS NULL
    OR claimed_by = auth.uid()
  )
  WITH CHECK (
    public.is_event_organizer(event_id)
    OR claimed_by IS NULL
    OR claimed_by = auth.uid()
  );

CREATE POLICY "Organizer can delete bring items" ON public.bring_items
  FOR DELETE TO authenticated
  USING (public.is_event_organizer(event_id));

CREATE TRIGGER bring_items_touch
  BEFORE UPDATE ON public.bring_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime
ALTER TABLE public.bring_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bring_items;
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- 1. How many units each bring item needs (enables partial / split claims)
ALTER TABLE public.bring_items
  ADD COLUMN IF NOT EXISTS qty_needed integer NOT NULL DEFAULT 1;

-- 2. Per-person partial claims on a bring item
CREATE TABLE public.bring_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  has_this boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bring_claims TO authenticated;
GRANT ALL ON public.bring_claims TO service_role;

ALTER TABLE public.bring_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view claims"
  ON public.bring_claims FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own claim"
  ON public.bring_claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own claim"
  ON public.bring_claims FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own claim"
  ON public.bring_claims FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER touch_bring_claims_updated_at
  BEFORE UPDATE ON public.bring_claims
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Keep bring_items.claimed_by / status in sync with claims (lead claimer +
--    confirmed when fully covered). Runs as definer so any claimer can update.
CREATE OR REPLACE FUNCTION public.recompute_bring_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item_id uuid;
  _needed int;
  _sum int;
  _lead uuid;
BEGIN
  _item_id := COALESCE(NEW.item_id, OLD.item_id);
  SELECT qty_needed INTO _needed FROM public.bring_items WHERE id = _item_id;
  SELECT COALESCE(SUM(qty), 0) INTO _sum FROM public.bring_claims WHERE item_id = _item_id;
  SELECT user_id INTO _lead FROM public.bring_claims WHERE item_id = _item_id ORDER BY created_at ASC LIMIT 1;
  UPDATE public.bring_items
    SET claimed_by = _lead,
        status = CASE
          WHEN _lead IS NULL THEN 'pending'
          WHEN _sum >= COALESCE(_needed, 1) THEN 'confirmed'
          ELSE 'pending'
        END
    WHERE id = _item_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_recompute_bring_item
  AFTER INSERT OR UPDATE OR DELETE ON public.bring_claims
  FOR EACH ROW EXECUTE FUNCTION public.recompute_bring_item();

-- 4. Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bring_claims;
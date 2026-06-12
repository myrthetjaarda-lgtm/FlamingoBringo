-- Birthday gift wishlist: present ideas + who buys / who pays what (Splitser style)

-- 1. Wishlist of present ideas for an event
CREATE TABLE public.gift_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  created_by uuid,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🎁',
  url text,
  note text,
  price numeric(10, 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_items TO authenticated;
GRANT ALL ON public.gift_items TO service_role;

ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view gift items"
  ON public.gift_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own gift item"
  ON public.gift_items FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users update own gift item"
  ON public.gift_items FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users delete own gift item"
  ON public.gift_items FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE TRIGGER touch_gift_items_updated_at
  BEFORE UPDATE ON public.gift_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Who pays what — one contribution per person per gift (Splitser / wie betaalt wat)
CREATE TABLE public.gift_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id uuid NOT NULL,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric(10, 2) NOT NULL DEFAULT 0,
  is_buyer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gift_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_contributions TO authenticated;
GRANT ALL ON public.gift_contributions TO service_role;

ALTER TABLE public.gift_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view gift contributions"
  ON public.gift_contributions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own gift contribution"
  ON public.gift_contributions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own gift contribution"
  ON public.gift_contributions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own gift contribution"
  ON public.gift_contributions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER touch_gift_contributions_updated_at
  BEFORE UPDATE ON public.gift_contributions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_contributions;

-- Recommendations & Hotspots: personal spot list (NL + Berlin), shareable via token, plus a cached festival calendar.

-- 1. Recommendation shares — named, revocable public links to the owner's list
CREATE TABLE public.recommendation_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendation_shares TO authenticated;
GRANT ALL ON public.recommendation_shares TO service_role;

ALTER TABLE public.recommendation_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own shares"
  ON public.recommendation_shares FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners create own shares"
  ON public.recommendation_shares FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners update own shares"
  ON public.recommendation_shares FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners delete own shares"
  ON public.recommendation_shares FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- No anon policy: the public share page resolves tokens through a service-role
-- server function, never through direct PostgREST access to this table.

-- 2. Recommendations — the food/activity/sight spots themselves
CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('restaurant', 'café', 'bar', 'activity', 'sight', 'other')),
  region text NOT NULL CHECK (region IN ('Netherlands', 'Berlin')),
  city text NOT NULL,
  address text NOT NULL,
  lat double precision,
  lng double precision,
  notes text,
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  added_by text NOT NULL,
  added_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  share_id uuid REFERENCES public.recommendation_shares(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT INSERT ON public.recommendations TO anon;
GRANT ALL ON public.recommendations TO service_role;

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Owner's in-app view. Public share-page reads go through a service-role
-- server function instead of a direct anon SELECT policy, so the list isn't
-- readable by anyone who merely has the (non-secret) anon key.
CREATE POLICY "Owners view own recommendations"
  ON public.recommendations FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners insert own recommendations"
  ON public.recommendations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Token-scoped anonymous insert: only allowed when share_id points at a
-- non-revoked share row. The client resolves token -> share_id server-side
-- first, so an anonymous writer can never guess a share_id directly.
CREATE POLICY "Anonymous insert via valid share token"
  ON public.recommendations FOR INSERT TO anon
  WITH CHECK (
    share_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.recommendation_shares s
      WHERE s.id = share_id AND s.revoked_at IS NULL AND s.owner_id = recommendations.owner_id
    )
  );

CREATE POLICY "Owners update own recommendations"
  ON public.recommendations FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners delete own recommendations"
  ON public.recommendations FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE TRIGGER touch_recommendations_updated_at
  BEFORE UPDATE ON public.recommendations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX recommendations_owner_id_idx ON public.recommendations (owner_id);
CREATE INDEX recommendations_share_id_idx ON public.recommendations (share_id);

-- 3. Festivals — cached calendar of NL + Berlin events, refreshed by a
-- scheduled Supabase Edge Function. Read-only to clients; writes are
-- service-role only (no client-facing INSERT/UPDATE policy).
CREATE TABLE public.festivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  external_id text NOT NULL,
  name text NOT NULL,
  region text NOT NULL CHECK (region IN ('Netherlands', 'Berlin')),
  city text,
  starts_on date,
  ends_on date,
  url text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

GRANT SELECT ON public.festivals TO anon, authenticated;
GRANT ALL ON public.festivals TO service_role;

ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view festivals"
  ON public.festivals FOR SELECT TO anon, authenticated
  USING (true);

CREATE INDEX festivals_region_starts_on_idx ON public.festivals (region, starts_on);

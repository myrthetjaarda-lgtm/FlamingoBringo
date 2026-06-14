-- Football match details + Splitser-style expense splitting (receipts, who paid what,
-- claim your share, settle up with shared PayPal / bank handles).
-- Note: public.touch_updated_at() and public.is_event_organizer() already exist.

-- ============================================================
-- 1. Football: optional match details on events
-- ============================================================
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS home_team text,
  ADD COLUMN IF NOT EXISTS away_team text,
  ADD COLUMN IF NOT EXISTS home_score integer,
  ADD COLUMN IF NOT EXISTS away_score integer;

-- ============================================================
-- 2. Payment handles on profiles (shared to settle up, Splitser-style)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paypal text,
  ADD COLUMN IF NOT EXISTS iban text,
  ADD COLUMN IF NOT EXISTS payment_note text;

-- ============================================================
-- 3. Expenses — a receipt / shared cost with one payer (wie betaalt wat)
-- ============================================================
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_by uuid,
  paid_by uuid NOT NULL,
  title text NOT NULL,
  emoji text NOT NULL DEFAULT '🧾',
  amount numeric(10, 2) NOT NULL DEFAULT 0,
  receipt_path text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX expenses_event_idx ON public.expenses(event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view expenses"
  ON public.expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users add expense they create"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator or organizer update expense"
  ON public.expenses FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_event_organizer(event_id))
  WITH CHECK (created_by = auth.uid() OR public.is_event_organizer(event_id));

CREATE POLICY "Creator or organizer delete expense"
  ON public.expenses FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_event_organizer(event_id));

CREATE TRIGGER expenses_touch
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Helper: can the current user manage this expense (its creator or the event organizer)?
-- SECURITY DEFINER so the expense_shares policies can call it without recursive RLS.
CREATE OR REPLACE FUNCTION public.can_manage_expense(_expense_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = _expense_id
      AND (e.created_by = auth.uid() OR public.is_event_organizer(e.event_id))
  );
$$;

-- ============================================================
-- 4. Expense shares — what each person owes on an expense + whether settled.
--    One row per person per expense. "Claim" your share and mark it paid.
-- ============================================================
CREATE TABLE public.expense_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric(10, 2) NOT NULL DEFAULT 0,
  settled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (expense_id, user_id)
);

CREATE INDEX expense_shares_expense_idx ON public.expense_shares(expense_id);
CREATE INDEX expense_shares_event_idx ON public.expense_shares(event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_shares TO authenticated;
GRANT ALL ON public.expense_shares TO service_role;

ALTER TABLE public.expense_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view expense shares"
  ON public.expense_shares FOR SELECT TO authenticated USING (true);

-- A person can manage their own share (claim / settle); the expense's creator or the
-- organizer can manage everyone's shares (to split the bill across the group).
CREATE POLICY "Own or managed expense share insert"
  ON public.expense_shares FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.can_manage_expense(expense_id));

CREATE POLICY "Own or managed expense share update"
  ON public.expense_shares FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_expense(expense_id))
  WITH CHECK (user_id = auth.uid() OR public.can_manage_expense(expense_id));

CREATE POLICY "Own or managed expense share delete"
  ON public.expense_shares FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_expense(expense_id));

CREATE TRIGGER expense_shares_touch
  BEFORE UPDATE ON public.expense_shares
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 5. Realtime for live updates
-- ============================================================
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER TABLE public.expense_shares REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_shares;

-- ============================================================
-- 6. Receipts storage bucket (public read so receipt images render;
--    authenticated users upload, owners manage their own uploads)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated can upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND owner = auth.uid());

CREATE POLICY "Owners can update their receipts"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'receipts' AND owner = auth.uid());

CREATE POLICY "Owners can delete their receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND owner = auth.uid());

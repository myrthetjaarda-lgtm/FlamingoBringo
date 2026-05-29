
-- 1. GROUPS
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🌟',
  tagline text,
  privacy text NOT NULL DEFAULT 'private',
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 2. GROUP MEMBERS
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Security-definer helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = auth.uid() AND role IN ('owner','admin')
  );
$$;

-- Groups RLS
CREATE POLICY "Authenticated can view groups" ON public.groups
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create groups" ON public.groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner or admin can update group" ON public.groups
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.is_group_admin(id));
CREATE POLICY "Owner can delete group" ON public.groups
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Group members RLS
CREATE POLICY "Authenticated can view memberships" ON public.group_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "User can join (insert self)" ON public.group_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Self or admin can remove" ON public.group_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_group_admin(group_id));
CREATE POLICY "Admin can update role" ON public.group_members
  FOR UPDATE TO authenticated USING (public.is_group_admin(group_id));

-- Auto-add creator as owner
CREATE OR REPLACE FUNCTION public.add_group_owner_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_groups_add_owner
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_group_owner_member();

CREATE TRIGGER trg_groups_touch
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. EVENTS: optional group link
ALTER TABLE public.events ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

-- 4. BRING_ITEMS: track creator + expand edit/delete rights
ALTER TABLE public.bring_items ADD COLUMN created_by uuid;

DROP POLICY IF EXISTS "Organizer can delete bring items" ON public.bring_items;
DROP POLICY IF EXISTS "Organizer or claimer can update" ON public.bring_items;

CREATE POLICY "Organizer or creator can delete bring items" ON public.bring_items
  FOR DELETE TO authenticated
  USING (public.is_event_organizer(event_id) OR created_by = auth.uid());

CREATE POLICY "Organizer, creator, or claimer can update" ON public.bring_items
  FOR UPDATE TO authenticated
  USING (
    public.is_event_organizer(event_id)
    OR created_by = auth.uid()
    OR claimed_by IS NULL
    OR claimed_by = auth.uid()
  )
  WITH CHECK (
    public.is_event_organizer(event_id)
    OR created_by = auth.uid()
    OR claimed_by IS NULL
    OR claimed_by = auth.uid()
  );

-- Also allow group members to add items to their group's event
DROP POLICY IF EXISTS "Organizer can add bring items" ON public.bring_items;
CREATE POLICY "Organizer or attendee can add bring items" ON public.bring_items
  FOR INSERT TO authenticated
  WITH CHECK (public.is_event_organizer(event_id) OR created_by = auth.uid());

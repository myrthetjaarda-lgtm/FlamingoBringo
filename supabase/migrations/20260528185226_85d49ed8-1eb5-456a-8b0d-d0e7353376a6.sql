ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS facebook text,
  ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT true;

ALTER TABLE public.bring_items
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS has_this boolean NOT NULL DEFAULT false;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type text;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;
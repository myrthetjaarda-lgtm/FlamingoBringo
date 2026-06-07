-- Mark items that belong to the "Everyone brings their own" section
ALTER TABLE public.bring_items ADD COLUMN IF NOT EXISTS is_byo boolean NOT NULL DEFAULT false;

-- Personal equipment list shown on profile ("What I have")
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipment text[] NOT NULL DEFAULT '{}';
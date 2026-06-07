-- Add availability status and social mode to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'In Berlin',
  ADD COLUMN IF NOT EXISTS social_mode TEXT NOT NULL DEFAULT 'Looking for plans';

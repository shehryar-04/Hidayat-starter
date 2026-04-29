-- ============================================================
-- Profile Extensions — adds per-role profile fields
-- Migration: 20240102000000_profile_extensions.sql
-- ============================================================

-- Add extra columns to profiles (safe — all nullable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name       text,
  ADD COLUMN IF NOT EXISTS last_name        text,
  ADD COLUMN IF NOT EXISTS avatar_url       text;   -- public URL of profile image

-- Scholar-specific extended fields stored on the scholars table
ALTER TABLE public.scholars
  ADD COLUMN IF NOT EXISTS title            text,
  ADD COLUMN IF NOT EXISTS bio              text;

-- Storage bucket for profile images is created via Supabase dashboard or CLI:
--   supabase storage create profile-images --public
-- RLS: any authenticated user can upload their own file (path = user_id)
-- The bucket name is "profile-images" and each file is named <user_id>

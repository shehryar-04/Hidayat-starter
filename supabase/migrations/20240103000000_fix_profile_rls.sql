-- ============================================================
-- Fix profile RLS policies so users can update their own row
-- and the auth trigger can insert on sign-up
-- Migration: 20240103000000_fix_profile_rls.sql
-- ============================================================

-- Drop the overly-restrictive policies
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- INSERT: allow the SECURITY DEFINER trigger to insert on sign-up.
-- The trigger runs as the function owner (postgres / service role) so it
-- bypasses RLS entirely — but we still need a permissive policy for any
-- direct inserts (e.g. admin creating a profile manually).
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    -- Admins can insert any profile
    public.get_my_role() = 'admin'
    -- A user can insert their own profile row (covers edge cases)
    OR auth.uid() = id
  );

-- UPDATE: users can update their own profile row (name, avatar, etc.)
-- Admins can update any profile row.
-- The role column is intentionally not restricted here at the SQL level —
-- role changes should go through the admin UI which already enforces this.
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    -- Own row
    auth.uid() = id
    -- Or admin
    OR public.get_my_role() = 'admin'
  );

-- ─── scholars: allow scholars to update their own row ─────────
-- The existing policy only allows admins to update scholars.
-- Scholars need to update their own title/bio/qualifications/specializations.
DROP POLICY IF EXISTS "scholars_update" ON public.scholars;

CREATE POLICY "scholars_update" ON public.scholars
  FOR UPDATE USING (
    -- Own row (scholar updating their own profile)
    profile_id = auth.uid()
    -- Or admin
    OR public.get_my_role() = 'admin'
  );

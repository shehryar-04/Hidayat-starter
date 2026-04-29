-- ============================================================
-- Allow anonymous (unauthenticated) users to read published fatwas
-- Migration: 20240105000000_darul_ifta_public_read.sql
-- ============================================================

-- Drop the existing select policy that requires auth.uid()
DROP POLICY IF EXISTS "fatwa_questions_select" ON public.fatwa_questions;

-- New policy: anyone can read published fatwas; authenticated users follow role rules
CREATE POLICY "fatwa_questions_select" ON public.fatwa_questions
  FOR SELECT USING (
    -- Published fatwas are public (no login required)
    status = 'published'
    -- Authenticated: admins and muftis see all
    OR public.get_my_role() IN ('admin', 'mufti')
    -- Authenticated: submitter can see their own
    OR submitted_by = auth.uid()
  );

-- Allow anonymous reads on fatwa_responses for published questions
DROP POLICY IF EXISTS "fatwa_responses_select" ON public.fatwa_responses;

CREATE POLICY "fatwa_responses_select" ON public.fatwa_responses
  FOR SELECT USING (
    -- Response is for a published question — public read
    EXISTS (
      SELECT 1 FROM public.fatwa_questions fq
      WHERE fq.id = question_id AND fq.status = 'published'
    )
    -- Or authenticated admin/mufti
    OR public.get_my_role() IN ('admin', 'mufti')
    -- Or the mufti who wrote it
    OR mufti_id = auth.uid()
  );

-- Allow scholars and students to insert questions (they can submit questions)
DROP POLICY IF EXISTS "fatwa_questions_insert" ON public.fatwa_questions;

CREATE POLICY "fatwa_questions_insert" ON public.fatwa_questions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

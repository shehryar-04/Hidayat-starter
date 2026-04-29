-- Allow students to enroll themselves in short courses
-- Migration: 20240107000000_student_self_enroll.sql

-- Drop the existing insert policy (admin-only)
DROP POLICY IF EXISTS "short_course_enrollments_insert" ON public.short_course_enrollments;

-- New policy: admins can enroll anyone; students can enroll themselves
CREATE POLICY "short_course_enrollments_insert" ON public.short_course_enrollments
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'admin'
    OR public.get_my_role() IN ('scholar', 'mufti')
    OR (
      public.get_my_role() = 'student'
      AND student_id = public.get_my_student_id()
    )
  );

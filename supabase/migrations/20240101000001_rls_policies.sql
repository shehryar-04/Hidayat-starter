-- ============================================================
-- Hidayat — Row-Level Security Policies
-- Migration: 20240101000001_rls_policies.sql
-- Req 1.3, 1.4, 14.1
-- ============================================================

-- Helper: get the authenticated user's role from profiles
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: get the scholar.id for the current user (null if not a scholar)
CREATE OR REPLACE FUNCTION public.get_my_scholar_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.scholars WHERE profile_id = auth.uid();
$$;

-- Helper: get the student.id for the current user (null if not a student)
CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE profile_id = auth.uid();
$$;

-- ─── profiles ─────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read all
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.get_my_role() = 'admin'
  );

-- Only admins can insert/update profiles (the trigger uses SECURITY DEFINER)
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (public.get_my_role() = 'admin');

-- ─── students ─────────────────────────────────────────────────
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Students: own row only; Scholars: assigned students; Admins: all
CREATE POLICY "students_select" ON public.students
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'student'
      AND profile_id = auth.uid()
    )
    OR (
      public.get_my_role() IN ('scholar', 'mufti')
      AND id IN (
        SELECT DISTINCT e.student_id
        FROM public.evaluations e
        WHERE e.scholar_id = public.get_my_scholar_id()
        UNION
        SELECT DISTINCT hp.student_id
        FROM public.hifz_progress hp
        WHERE hp.scholar_id = public.get_my_scholar_id()
        UNION
        SELECT DISTINCT np.student_id
        FROM public.nazra_progress np
        WHERE np.scholar_id = public.get_my_scholar_id()
      )
    )
  );

CREATE POLICY "students_insert" ON public.students
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "students_update" ON public.students
  FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE POLICY "students_delete" ON public.students
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── scholars ─────────────────────────────────────────────────
ALTER TABLE public.scholars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scholars_select" ON public.scholars
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR profile_id = auth.uid()
  );

CREATE POLICY "scholars_insert" ON public.scholars
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "scholars_update" ON public.scholars
  FOR UPDATE USING (public.get_my_role() = 'admin');

-- ─── evaluations ──────────────────────────────────────────────
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Students: own rows; Scholars: rows they authored; Admins: all
CREATE POLICY "evaluations_select" ON public.evaluations
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'student'
      AND student_id = public.get_my_student_id()
    )
    OR (
      public.get_my_role() IN ('scholar', 'mufti')
      AND scholar_id = public.get_my_scholar_id()
    )
  );

CREATE POLICY "evaluations_insert" ON public.evaluations
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'admin'
    OR public.get_my_role() IN ('scholar', 'mufti')
  );

CREATE POLICY "evaluations_update" ON public.evaluations
  FOR UPDATE USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() IN ('scholar', 'mufti')
      AND scholar_id = public.get_my_scholar_id()
    )
  );

-- ─── hifz_progress ────────────────────────────────────────────
ALTER TABLE public.hifz_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hifz_progress_select" ON public.hifz_progress
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'student'
      AND student_id = public.get_my_student_id()
    )
    OR (
      public.get_my_role() IN ('scholar', 'mufti')
      AND scholar_id = public.get_my_scholar_id()
    )
  );

CREATE POLICY "hifz_progress_insert" ON public.hifz_progress
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'admin'
    OR public.get_my_role() IN ('scholar', 'mufti')
  );

CREATE POLICY "hifz_progress_update" ON public.hifz_progress
  FOR UPDATE USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() IN ('scholar', 'mufti')
      AND scholar_id = public.get_my_scholar_id()
    )
  );

-- ─── hifz_audit_log ───────────────────────────────────────────
ALTER TABLE public.hifz_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hifz_audit_log_select" ON public.hifz_audit_log
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'student'
      AND student_id = public.get_my_student_id()
    )
    OR public.get_my_role() IN ('scholar', 'mufti')
  );

CREATE POLICY "hifz_audit_log_insert" ON public.hifz_audit_log
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('admin', 'scholar', 'mufti')
  );

-- ─── nazra_progress ───────────────────────────────────────────
ALTER TABLE public.nazra_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nazra_progress_select" ON public.nazra_progress
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'student'
      AND student_id = public.get_my_student_id()
    )
    OR (
      public.get_my_role() IN ('scholar', 'mufti')
      AND scholar_id = public.get_my_scholar_id()
    )
  );

CREATE POLICY "nazra_progress_insert" ON public.nazra_progress
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'admin'
    OR public.get_my_role() IN ('scholar', 'mufti')
  );

CREATE POLICY "nazra_progress_update" ON public.nazra_progress
  FOR UPDATE USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() IN ('scholar', 'mufti')
      AND scholar_id = public.get_my_scholar_id()
    )
  );

-- ─── nazra_lessons ────────────────────────────────────────────
ALTER TABLE public.nazra_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nazra_lessons_select" ON public.nazra_lessons
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "nazra_lessons_write" ON public.nazra_lessons
  FOR ALL USING (public.get_my_role() = 'admin');

-- ─── fatwa_questions ──────────────────────────────────────────
ALTER TABLE public.fatwa_questions ENABLE ROW LEVEL SECURITY;

-- Students: own submissions; Muftis: all; Admins: all
CREATE POLICY "fatwa_questions_select" ON public.fatwa_questions
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR public.get_my_role() = 'mufti'
    OR submitted_by = auth.uid()
  );

-- Any authenticated user can submit a question (Req 8.1)
CREATE POLICY "fatwa_questions_insert" ON public.fatwa_questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "fatwa_questions_update" ON public.fatwa_questions
  FOR UPDATE USING (
    public.get_my_role() = 'admin'
    OR public.get_my_role() = 'mufti'
  );

-- ─── fatwa_responses ──────────────────────────────────────────
ALTER TABLE public.fatwa_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fatwa_responses_select" ON public.fatwa_responses
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR public.get_my_role() = 'mufti'
    OR mufti_id = auth.uid()
  );

CREATE POLICY "fatwa_responses_insert" ON public.fatwa_responses
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('admin', 'mufti')
  );

-- ─── fatwa_audit_log ──────────────────────────────────────────
ALTER TABLE public.fatwa_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fatwa_audit_log_select" ON public.fatwa_audit_log
  FOR SELECT USING (
    public.get_my_role() IN ('admin', 'mufti')
  );

CREATE POLICY "fatwa_audit_log_insert" ON public.fatwa_audit_log
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('admin', 'mufti')
  );

-- ─── publications ─────────────────────────────────────────────
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

-- Students: published only; Scholars: own + published; Admins: all
CREATE POLICY "publications_select" ON public.publications
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() IN ('scholar', 'mufti')
      AND (status = 'published' OR submitted_by = auth.uid())
    )
    OR (
      public.get_my_role() = 'student'
      AND status = 'published'
    )
  );

CREATE POLICY "publications_insert" ON public.publications
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('admin', 'scholar', 'mufti')
  );

CREATE POLICY "publications_update" ON public.publications
  FOR UPDATE USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() IN ('scholar', 'mufti')
      AND submitted_by = auth.uid()
    )
  );

-- ─── form_schemas ─────────────────────────────────────────────
ALTER TABLE public.form_schemas ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read; only admins can write
CREATE POLICY "form_schemas_select" ON public.form_schemas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "form_schemas_insert" ON public.form_schemas
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "form_schemas_update" ON public.form_schemas
  FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE POLICY "form_schemas_delete" ON public.form_schemas
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── feature_flags ────────────────────────────────────────────
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read; only admins can write
CREATE POLICY "feature_flags_select" ON public.feature_flags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "feature_flags_insert" ON public.feature_flags
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "feature_flags_update" ON public.feature_flags
  FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE POLICY "feature_flags_delete" ON public.feature_flags
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── report_schemas ───────────────────────────────────────────
ALTER TABLE public.report_schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_schemas_select" ON public.report_schemas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "report_schemas_insert" ON public.report_schemas
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "report_schemas_update" ON public.report_schemas
  FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE POLICY "report_schemas_delete" ON public.report_schemas
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── wazifa_rules ─────────────────────────────────────────────
ALTER TABLE public.wazifa_rules ENABLE ROW LEVEL SECURITY;

-- No student or scholar access; admins only
CREATE POLICY "wazifa_rules_select" ON public.wazifa_rules
  FOR SELECT USING (public.get_my_role() = 'admin');

CREATE POLICY "wazifa_rules_insert" ON public.wazifa_rules
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "wazifa_rules_update" ON public.wazifa_rules
  FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE POLICY "wazifa_rules_delete" ON public.wazifa_rules
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── wazifa_evaluations ───────────────────────────────────────
ALTER TABLE public.wazifa_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wazifa_evaluations_select" ON public.wazifa_evaluations
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'student'
      AND student_id = public.get_my_student_id()
    )
  );

CREATE POLICY "wazifa_evaluations_insert" ON public.wazifa_evaluations
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

-- ─── student_enrollments ──────────────────────────────────────
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_enrollments_select" ON public.student_enrollments
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'student'
      AND student_id = public.get_my_student_id()
    )
    OR public.get_my_role() IN ('scholar', 'mufti')
  );

CREATE POLICY "student_enrollments_insert" ON public.student_enrollments
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "student_enrollments_update" ON public.student_enrollments
  FOR UPDATE USING (public.get_my_role() = 'admin');

-- ─── student_status_history ───────────────────────────────────
ALTER TABLE public.student_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_status_history_select" ON public.student_status_history
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'student'
      AND student_id = public.get_my_student_id()
    )
  );

CREATE POLICY "student_status_history_insert" ON public.student_status_history
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

-- ─── edge_function_log ────────────────────────────────────────
ALTER TABLE public.edge_function_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs; inserts happen via service role in Edge Functions
CREATE POLICY "edge_function_log_select" ON public.edge_function_log
  FOR SELECT USING (public.get_my_role() = 'admin');

-- ─── short_courses ────────────────────────────────────────────
ALTER TABLE public.short_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "short_courses_select" ON public.short_courses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "short_courses_insert" ON public.short_courses
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "short_courses_update" ON public.short_courses
  FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE POLICY "short_courses_delete" ON public.short_courses
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── short_course_enrollments ─────────────────────────────────
ALTER TABLE public.short_course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "short_course_enrollments_select" ON public.short_course_enrollments
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'student'
      AND student_id = public.get_my_student_id()
    )
    OR public.get_my_role() IN ('scholar', 'mufti')
  );

CREATE POLICY "short_course_enrollments_insert" ON public.short_course_enrollments
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "short_course_enrollments_update" ON public.short_course_enrollments
  FOR UPDATE USING (public.get_my_role() = 'admin');

-- ─── dars_e_nizami_levels ─────────────────────────────────────
ALTER TABLE public.dars_e_nizami_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dars_e_nizami_levels_select" ON public.dars_e_nizami_levels
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "dars_e_nizami_levels_write" ON public.dars_e_nizami_levels
  FOR ALL USING (public.get_my_role() = 'admin');

-- ─── dars_e_nizami_subjects ───────────────────────────────────
ALTER TABLE public.dars_e_nizami_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dars_e_nizami_subjects_select" ON public.dars_e_nizami_subjects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "dars_e_nizami_subjects_write" ON public.dars_e_nizami_subjects
  FOR ALL USING (public.get_my_role() = 'admin');

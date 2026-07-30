-- ============================================================
-- HIDAYAT — COMBINED MIGRATION (dependency-ordered)
-- Run this in Supabase Studio SQL Editor
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- EXTENSIONS (must be first)
-- ═══════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════════════
-- PART 1: 20240101000000_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('admin','scholar','mufti','student')),
  full_name   text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.students (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  enrollment_number text UNIQUE NOT NULL,
  date_of_birth     date,
  gender            text,
  contact_info      jsonb,
  guardian_info     jsonb,
  enrollment_date   date NOT NULL,
  status            text NOT NULL CHECK (status IN ('active','suspended','graduated','withdrawn')),
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_enrollment_number ON public.students (enrollment_number);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students (status);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON public.students (enrollment_date);

CREATE TABLE IF NOT EXISTS public.scholars (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  qualifications    text[],
  specializations   text[],
  contact_info      jsonb,
  employment_status text NOT NULL CHECK (employment_status IN ('active','inactive')),
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_schemas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_key    text UNIQUE NOT NULL,
  version     integer NOT NULL DEFAULT 1,
  schema      jsonb NOT NULL,
  updated_at  timestamptz DEFAULT now(),
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module      text UNIQUE NOT NULL,
  enabled     boolean NOT NULL DEFAULT true,
  updated_at  timestamptz DEFAULT now(),
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.report_schemas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_key  text UNIQUE NOT NULL,
  schema      jsonb NOT NULL,
  updated_at  timestamptz DEFAULT now(),
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.wazifa_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version     integer NOT NULL DEFAULT 1,
  rules       jsonb NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  updated_at  timestamptz DEFAULT now(),
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.dars_e_nizami_levels (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  sequence_order   integer NOT NULL,
  passing_threshold numeric NOT NULL DEFAULT 50
);

CREATE TABLE IF NOT EXISTS public.dars_e_nizami_subjects (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid REFERENCES public.dars_e_nizami_levels(id) ON DELETE CASCADE,
  name     text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid REFERENCES public.students(id) ON DELETE CASCADE,
  program     text NOT NULL,
  level_id    uuid REFERENCES public.dars_e_nizami_levels(id) ON DELETE SET NULL,
  enrolled_at date NOT NULL,
  status      text NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_program ON public.student_enrollments (program);

CREATE TABLE IF NOT EXISTS public.evaluations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id   uuid REFERENCES public.dars_e_nizami_subjects(id) ON DELETE SET NULL,
  level_id     uuid REFERENCES public.dars_e_nizami_levels(id) ON DELETE SET NULL,
  scholar_id   uuid REFERENCES public.scholars(id) ON DELETE SET NULL,
  score        numeric NOT NULL,
  evaluated_at date NOT NULL,
  flagged      boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON public.evaluations (student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_scholar_id ON public.evaluations (scholar_id);

CREATE TABLE IF NOT EXISTS public.hifz_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid REFERENCES public.students(id) ON DELETE CASCADE,
  juz_number   integer NOT NULL CHECK (juz_number BETWEEN 1 AND 30),
  status       text NOT NULL CHECK (status IN ('not_started','in_progress','memorized','revised')),
  memorized_at date,
  scholar_id   uuid REFERENCES public.scholars(id) ON DELETE SET NULL,
  UNIQUE (student_id, juz_number)
);

CREATE TABLE IF NOT EXISTS public.hifz_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid REFERENCES public.students(id) ON DELETE CASCADE,
  juz_number  integer NOT NULL,
  old_status  text,
  new_status  text NOT NULL,
  changed_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nazra_lessons (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_order integer NOT NULL,
  title          text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.nazra_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id    uuid REFERENCES public.nazra_lessons(id) ON DELETE CASCADE,
  completed_at date NOT NULL,
  scholar_id   uuid REFERENCES public.scholars(id) ON DELETE SET NULL,
  quality_note text,
  UNIQUE (student_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.short_courses (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text NOT NULL,
  description          text,
  duration_weeks       integer,
  fee                  numeric,
  start_date           date,
  end_date             date,
  certificate_template text,
  created_by           uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.short_course_enrollments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    uuid REFERENCES public.short_courses(id) ON DELETE CASCADE,
  student_id   uuid REFERENCES public.students(id) ON DELETE CASCADE,
  enrolled_at  date NOT NULL,
  payment_ref  text,
  status       text NOT NULL DEFAULT 'active',
  completed_at date
);

CREATE INDEX IF NOT EXISTS idx_short_course_enrollments_course_id ON public.short_course_enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_short_course_enrollments_student_id ON public.short_course_enrollments (student_id);

CREATE TABLE IF NOT EXISTS public.fatwa_questions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  submitted_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  question_text    text NOT NULL,
  context          text,
  status           text NOT NULL CHECK (status IN ('pending','assigned','under_review','approved','published','closed')),
  assigned_mufti   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  duplicate_of     uuid REFERENCES public.fatwa_questions(id) ON DELETE SET NULL,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fatwa_questions_status ON public.fatwa_questions (status);
CREATE INDEX IF NOT EXISTS idx_fatwa_questions_submitted_by ON public.fatwa_questions (submitted_by);

CREATE TABLE IF NOT EXISTS public.fatwa_responses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   uuid REFERENCES public.fatwa_questions(id) ON DELETE CASCADE,
  mufti_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  response_text text NOT NULL,
  submitted_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fatwa_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.fatwa_questions(id) ON DELETE CASCADE,
  old_status  text,
  new_status  text NOT NULL,
  actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  acted_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.publications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  abstract         text,
  authors          text[],
  publication_type text NOT NULL CHECK (publication_type IN ('paper','book','article')),
  file_path        text,
  status           text NOT NULL CHECK (status IN ('under_review','published','rejected')),
  submitted_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at     timestamptz DEFAULT now(),
  download_count   integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_publications_status ON public.publications (status);
CREATE INDEX IF NOT EXISTS idx_publications_submitted_by ON public.publications (submitted_by);

CREATE TABLE IF NOT EXISTS public.wazifa_evaluations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid REFERENCES public.students(id) ON DELETE CASCADE,
  rule_version    integer NOT NULL,
  eligible        boolean NOT NULL,
  stipend_amount  numeric,
  evaluated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid REFERENCES public.students(id) ON DELETE CASCADE,
  old_status  text,
  new_status  text NOT NULL,
  changed_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edge_function_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  caller_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  operation     text,
  success       boolean NOT NULL,
  invoked_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scholar_subject_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholar_id  uuid REFERENCES public.scholars(id) ON DELETE CASCADE,
  subject_id  uuid REFERENCES public.dars_e_nizami_subjects(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (scholar_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_scholar_subject_assignments_scholar_id ON public.scholar_subject_assignments (scholar_id);
CREATE INDEX IF NOT EXISTS idx_scholar_subject_assignments_subject_id ON public.scholar_subject_assignments (subject_id);

CREATE TABLE IF NOT EXISTS public.scholar_program_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholar_id  uuid REFERENCES public.scholars(id) ON DELETE CASCADE,
  program     text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (scholar_id, program)
);

CREATE INDEX IF NOT EXISTS idx_scholar_program_assignments_scholar_id ON public.scholar_program_assignments (scholar_id);

CREATE TABLE IF NOT EXISTS public.student_scholar_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid REFERENCES public.students(id) ON DELETE CASCADE,
  scholar_id      uuid REFERENCES public.scholars(id) ON DELETE CASCADE,
  assignment_type text NOT NULL CHECK (assignment_type IN ('evaluation', 'mentoring', 'hifz', 'nazra')),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged_for_review', 'reassigned')),
  assigned_at     timestamptz DEFAULT now(),
  assigned_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  flagged_at      timestamptz,
  flagged_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (student_id, scholar_id, assignment_type)
);

CREATE INDEX IF NOT EXISTS idx_student_scholar_assignments_student_id ON public.student_scholar_assignments (student_id);
CREATE INDEX IF NOT EXISTS idx_student_scholar_assignments_scholar_id ON public.student_scholar_assignments (scholar_id);
CREATE INDEX IF NOT EXISTS idx_student_scholar_assignments_status ON public.student_scholar_assignments (status);

-- ═══════════════════════════════════════════════════════════════
-- PART 1b: CREATE FATWAS TABLE EARLY (needed by later migrations)
-- Originally from 20240121000000_fatwas_table_link.sql - moved up
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.fatwas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fatwa_number    text UNIQUE NOT NULL,
  title           text NOT NULL,
  question        text NOT NULL,
  answer          text NOT NULL,
  fatwa_ref       text,
  dar_ul_ifta     text DEFAULT 'Hidayat Darul Ifta',
  category_1      text,
  category_2      text,
  category_3      text,
  source_question_id uuid REFERENCES public.fatwa_questions(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fatwas_source_question_id ON public.fatwas (source_question_id);
CREATE INDEX IF NOT EXISTS idx_fatwas_category_1 ON public.fatwas (category_1);
CREATE INDEX IF NOT EXISTS idx_fatwas_categories ON public.fatwas (category_1, category_2, category_3);
CREATE INDEX IF NOT EXISTS idx_fatwas_fatwa_number ON public.fatwas (fatwa_number);


-- ═══════════════════════════════════════════════════════════════
-- PART 2: 20240101000001_rls_policies.sql
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_scholar_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.scholars WHERE profile_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE profile_id = auth.uid();
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.get_my_role() = 'admin');
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (public.get_my_role() = 'admin');

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_select" ON public.students
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (public.get_my_role() = 'student' AND profile_id = auth.uid())
    OR (public.get_my_role() IN ('scholar', 'mufti') AND id IN (
      SELECT DISTINCT e.student_id FROM public.evaluations e WHERE e.scholar_id = public.get_my_scholar_id()
      UNION SELECT DISTINCT hp.student_id FROM public.hifz_progress hp WHERE hp.scholar_id = public.get_my_scholar_id()
      UNION SELECT DISTINCT np.student_id FROM public.nazra_progress np WHERE np.scholar_id = public.get_my_scholar_id()
    ))
  );
CREATE POLICY "students_insert" ON public.students FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "students_update" ON public.students FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "students_delete" ON public.students FOR DELETE USING (public.get_my_role() = 'admin');

ALTER TABLE public.scholars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scholars_select" ON public.scholars FOR SELECT USING (public.get_my_role() = 'admin' OR profile_id = auth.uid());
CREATE POLICY "scholars_insert" ON public.scholars FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "scholars_update" ON public.scholars FOR UPDATE USING (public.get_my_role() = 'admin');

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evaluations_select" ON public.evaluations
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (public.get_my_role() = 'student' AND student_id = public.get_my_student_id())
    OR (public.get_my_role() IN ('scholar', 'mufti') AND scholar_id = public.get_my_scholar_id())
  );
CREATE POLICY "evaluations_insert" ON public.evaluations
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin' OR public.get_my_role() IN ('scholar', 'mufti'));
CREATE POLICY "evaluations_update" ON public.evaluations
  FOR UPDATE USING (public.get_my_role() = 'admin' OR (public.get_my_role() IN ('scholar', 'mufti') AND scholar_id = public.get_my_scholar_id()));

ALTER TABLE public.hifz_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hifz_progress_select" ON public.hifz_progress
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (public.get_my_role() = 'student' AND student_id = public.get_my_student_id())
    OR (public.get_my_role() IN ('scholar', 'mufti') AND scholar_id = public.get_my_scholar_id())
  );
CREATE POLICY "hifz_progress_insert" ON public.hifz_progress
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin' OR public.get_my_role() IN ('scholar', 'mufti'));
CREATE POLICY "hifz_progress_update" ON public.hifz_progress
  FOR UPDATE USING (public.get_my_role() = 'admin' OR (public.get_my_role() IN ('scholar', 'mufti') AND scholar_id = public.get_my_scholar_id()));

ALTER TABLE public.hifz_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hifz_audit_log_select" ON public.hifz_audit_log
  FOR SELECT USING (public.get_my_role() = 'admin' OR (public.get_my_role() = 'student' AND student_id = public.get_my_student_id()) OR public.get_my_role() IN ('scholar', 'mufti'));
CREATE POLICY "hifz_audit_log_insert" ON public.hifz_audit_log
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'scholar', 'mufti'));

ALTER TABLE public.nazra_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nazra_progress_select" ON public.nazra_progress
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (public.get_my_role() = 'student' AND student_id = public.get_my_student_id())
    OR (public.get_my_role() IN ('scholar', 'mufti') AND scholar_id = public.get_my_scholar_id())
  );
CREATE POLICY "nazra_progress_insert" ON public.nazra_progress
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin' OR public.get_my_role() IN ('scholar', 'mufti'));
CREATE POLICY "nazra_progress_update" ON public.nazra_progress
  FOR UPDATE USING (public.get_my_role() = 'admin' OR (public.get_my_role() IN ('scholar', 'mufti') AND scholar_id = public.get_my_scholar_id()));

ALTER TABLE public.nazra_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nazra_lessons_select" ON public.nazra_lessons FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "nazra_lessons_write" ON public.nazra_lessons FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.fatwa_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fatwa_questions_select" ON public.fatwa_questions
  FOR SELECT USING (
    public.get_my_role() = 'admin' OR public.get_my_role() = 'mufti' OR submitted_by = auth.uid()
  );
CREATE POLICY "fatwa_questions_insert" ON public.fatwa_questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "fatwa_questions_update" ON public.fatwa_questions
  FOR UPDATE USING (public.get_my_role() = 'admin' OR public.get_my_role() = 'mufti');

ALTER TABLE public.fatwa_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fatwa_responses_select" ON public.fatwa_responses
  FOR SELECT USING (public.get_my_role() = 'admin' OR public.get_my_role() = 'mufti' OR mufti_id = auth.uid());
CREATE POLICY "fatwa_responses_insert" ON public.fatwa_responses
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'mufti'));

ALTER TABLE public.fatwa_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fatwa_audit_log_select" ON public.fatwa_audit_log FOR SELECT USING (public.get_my_role() IN ('admin', 'mufti'));
CREATE POLICY "fatwa_audit_log_insert" ON public.fatwa_audit_log FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'mufti'));

ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "publications_select" ON public.publications
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR (public.get_my_role() IN ('scholar', 'mufti') AND (status = 'published' OR submitted_by = auth.uid()))
    OR (public.get_my_role() = 'student' AND status = 'published')
  );
CREATE POLICY "publications_insert" ON public.publications
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'scholar', 'mufti'));
CREATE POLICY "publications_update" ON public.publications
  FOR UPDATE USING (public.get_my_role() = 'admin' OR (public.get_my_role() IN ('scholar', 'mufti') AND submitted_by = auth.uid()));

ALTER TABLE public.form_schemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "form_schemas_select" ON public.form_schemas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "form_schemas_insert" ON public.form_schemas FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "form_schemas_update" ON public.form_schemas FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "form_schemas_delete" ON public.form_schemas FOR DELETE USING (public.get_my_role() = 'admin');

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feature_flags_select" ON public.feature_flags FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "feature_flags_insert" ON public.feature_flags FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "feature_flags_update" ON public.feature_flags FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "feature_flags_delete" ON public.feature_flags FOR DELETE USING (public.get_my_role() = 'admin');

ALTER TABLE public.report_schemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_schemas_select" ON public.report_schemas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "report_schemas_insert" ON public.report_schemas FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "report_schemas_update" ON public.report_schemas FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "report_schemas_delete" ON public.report_schemas FOR DELETE USING (public.get_my_role() = 'admin');

ALTER TABLE public.wazifa_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wazifa_rules_select" ON public.wazifa_rules FOR SELECT USING (public.get_my_role() = 'admin');
CREATE POLICY "wazifa_rules_insert" ON public.wazifa_rules FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "wazifa_rules_update" ON public.wazifa_rules FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "wazifa_rules_delete" ON public.wazifa_rules FOR DELETE USING (public.get_my_role() = 'admin');

ALTER TABLE public.wazifa_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wazifa_evaluations_select" ON public.wazifa_evaluations
  FOR SELECT USING (public.get_my_role() = 'admin' OR (public.get_my_role() = 'student' AND student_id = public.get_my_student_id()));
CREATE POLICY "wazifa_evaluations_insert" ON public.wazifa_evaluations FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_enrollments_select" ON public.student_enrollments
  FOR SELECT USING (public.get_my_role() = 'admin' OR (public.get_my_role() = 'student' AND student_id = public.get_my_student_id()) OR public.get_my_role() IN ('scholar', 'mufti'));
CREATE POLICY "student_enrollments_insert" ON public.student_enrollments FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "student_enrollments_update" ON public.student_enrollments FOR UPDATE USING (public.get_my_role() = 'admin');

ALTER TABLE public.student_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_status_history_select" ON public.student_status_history
  FOR SELECT USING (public.get_my_role() = 'admin' OR (public.get_my_role() = 'student' AND student_id = public.get_my_student_id()));
CREATE POLICY "student_status_history_insert" ON public.student_status_history FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

ALTER TABLE public.edge_function_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edge_function_log_select" ON public.edge_function_log FOR SELECT USING (public.get_my_role() = 'admin');

ALTER TABLE public.short_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "short_courses_select" ON public.short_courses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "short_courses_insert" ON public.short_courses FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "short_courses_update" ON public.short_courses FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "short_courses_delete" ON public.short_courses FOR DELETE USING (public.get_my_role() = 'admin');

ALTER TABLE public.short_course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "short_course_enrollments_select" ON public.short_course_enrollments
  FOR SELECT USING (public.get_my_role() = 'admin' OR (public.get_my_role() = 'student' AND student_id = public.get_my_student_id()) OR public.get_my_role() IN ('scholar', 'mufti'));
CREATE POLICY "short_course_enrollments_insert" ON public.short_course_enrollments FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "short_course_enrollments_update" ON public.short_course_enrollments FOR UPDATE USING (public.get_my_role() = 'admin');

ALTER TABLE public.dars_e_nizami_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dars_e_nizami_levels_select" ON public.dars_e_nizami_levels FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "dars_e_nizami_levels_write" ON public.dars_e_nizami_levels FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.dars_e_nizami_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dars_e_nizami_subjects_select" ON public.dars_e_nizami_subjects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "dars_e_nizami_subjects_write" ON public.dars_e_nizami_subjects FOR ALL USING (public.get_my_role() = 'admin');

-- Fatwas RLS (table already created above)
ALTER TABLE public.fatwas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_fatwas" ON public.fatwas FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_read_fatwas" ON public.fatwas FOR SELECT TO authenticated USING (true);


-- ═══════════════════════════════════════════════════════════════
-- PART 3: Profile & Course Extensions
-- ═══════════════════════════════════════════════════════════════

-- 20240102000000_profile_extensions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.scholars
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS bio text;

-- 20240103000000_fix_profile_rls
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin' OR auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "scholars_update" ON public.scholars;
CREATE POLICY "scholars_update" ON public.scholars
  FOR UPDATE USING (profile_id = auth.uid() OR public.get_my_role() = 'admin');

-- 20240104000000_short_courses_extended
ALTER TABLE public.short_courses
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'All levels' CHECK (level IN ('Beginner','Intermediate','Advanced','All levels')),
  ADD COLUMN IF NOT EXISTS learning_objectives text[],
  ADD COLUMN IF NOT EXISTS requirements text[],
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS promo_video_url text,
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qa_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS announcements_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS comments_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived'));

CREATE TABLE IF NOT EXISTS public.course_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON public.course_sections(course_id);

CREATE TABLE IF NOT EXISTS public.course_lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  content_text text,
  video_url text,
  duration_minutes integer,
  is_free_preview boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_lectures_section_id ON public.course_lectures(section_id);
CREATE INDEX IF NOT EXISTS idx_course_lectures_course_id ON public.course_lectures(course_id);

CREATE TABLE IF NOT EXISTS public.lecture_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid NOT NULL REFERENCES public.course_lectures(id) ON DELETE CASCADE,
  title text NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('file','link')),
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lecture_resources_lecture_id ON public.lecture_resources(lecture_id);

ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_sections_select" ON public.course_sections FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "course_sections_write" ON public.course_sections FOR ALL USING (public.get_my_role() IN ('admin','scholar','mufti'));

ALTER TABLE public.course_lectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_lectures_select" ON public.course_lectures FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "course_lectures_write" ON public.course_lectures FOR ALL USING (public.get_my_role() IN ('admin','scholar','mufti'));

ALTER TABLE public.lecture_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lecture_resources_select" ON public.lecture_resources FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "lecture_resources_write" ON public.lecture_resources FOR ALL USING (public.get_my_role() IN ('admin','scholar','mufti'));

DROP POLICY IF EXISTS "short_courses_insert" ON public.short_courses;
CREATE POLICY "short_courses_insert" ON public.short_courses
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin','scholar','mufti'));
DROP POLICY IF EXISTS "short_courses_update" ON public.short_courses;
CREATE POLICY "short_courses_update" ON public.short_courses
  FOR UPDATE USING (public.get_my_role() = 'admin' OR created_by = auth.uid());

-- 20240105000000_darul_ifta_public_read
DROP POLICY IF EXISTS "fatwa_questions_select" ON public.fatwa_questions;
CREATE POLICY "fatwa_questions_select" ON public.fatwa_questions
  FOR SELECT USING (
    status = 'published'
    OR public.get_my_role() IN ('admin', 'mufti')
    OR submitted_by = auth.uid()
  );
DROP POLICY IF EXISTS "fatwa_responses_select" ON public.fatwa_responses;
CREATE POLICY "fatwa_responses_select" ON public.fatwa_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.fatwa_questions fq WHERE fq.id = question_id AND fq.status = 'published')
    OR public.get_my_role() IN ('admin', 'mufti')
    OR mufti_id = auth.uid()
  );
DROP POLICY IF EXISTS "fatwa_questions_insert" ON public.fatwa_questions;
CREATE POLICY "fatwa_questions_insert" ON public.fatwa_questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 20240106000000_fatwa_response_references
ALTER TABLE public.fatwa_responses ADD COLUMN IF NOT EXISTS quotes text;

-- 20240107000000_student_self_enroll
DROP POLICY IF EXISTS "short_course_enrollments_insert" ON public.short_course_enrollments;
CREATE POLICY "short_course_enrollments_insert" ON public.short_course_enrollments
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'admin' OR public.get_my_role() IN ('scholar', 'mufti')
    OR (public.get_my_role() = 'student' AND student_id = public.get_my_student_id())
  );

-- 20240108000000_auto_create_student
CREATE OR REPLACE FUNCTION public.handle_new_student_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.students (profile_id, enrollment_number, enrollment_date, status)
    VALUES (NEW.id, 'STU-' || EXTRACT(EPOCH FROM now())::bigint || '-' || floor(random() * 9000 + 1000)::int, CURRENT_DATE, 'active')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_student_profile_created ON public.profiles;
CREATE TRIGGER on_student_profile_created AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_student_profile();
DROP TRIGGER IF EXISTS on_profile_role_changed_to_student ON public.profiles;
CREATE TRIGGER on_profile_role_changed_to_student AFTER UPDATE OF role ON public.profiles FOR EACH ROW WHEN (NEW.role = 'student' AND OLD.role IS DISTINCT FROM 'student') EXECUTE FUNCTION public.handle_new_student_profile();

-- 20240109000000_course_pending_approval
ALTER TABLE public.short_courses DROP CONSTRAINT IF EXISTS short_courses_status_check;
ALTER TABLE public.short_courses ADD CONSTRAINT short_courses_status_check CHECK (status IN ('draft', 'pending_approval', 'published', 'archived'));

-- 20240110000000_enrollment_approval
ALTER TABLE public.short_course_enrollments DROP CONSTRAINT IF EXISTS short_course_enrollments_status_check;
ALTER TABLE public.short_course_enrollments ADD CONSTRAINT short_course_enrollments_status_check CHECK (status IN ('pending', 'active', 'completed', 'incomplete'));

-- 20240111000000_research_center_public (skip duplicate publications RLS - already enabled above)
INSERT INTO storage.buckets (id, name, public) VALUES ('research-publications', 'research-publications', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read research publications" ON storage.objects FOR SELECT USING (bucket_id = 'research-publications');
CREATE POLICY "Authenticated users upload research publications" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'research-publications');


-- ═══════════════════════════════════════════════════════════════
-- PART 4: Articles, Rate Limiting, Security, Payments
-- ═══════════════════════════════════════════════════════════════

-- 20240112000000_articles_table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  author_name TEXT,
  file_url TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published articles" ON articles FOR SELECT USING (published = true);
CREATE POLICY "Admin can manage articles" ON articles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC) WHERE published = true;

-- 20240113000000_signup_rate_limit
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email text,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_signup_attempts_ip ON public.signup_attempts (ip_address, attempted_at);
CREATE INDEX idx_signup_attempts_email ON public.signup_attempts (email, attempted_at);
ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.cleanup_signup_attempts()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.signup_attempts WHERE attempted_at < now() - interval '24 hours';
$$;

CREATE OR REPLACE FUNCTION public.check_signup_rate_limit(p_ip text, p_email text, p_max_per_ip_per_hour int DEFAULT 5, p_max_per_email_per_hour int DEFAULT 3)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ip_count int; email_count int; result jsonb;
BEGIN
  SELECT COUNT(*) INTO ip_count FROM public.signup_attempts WHERE ip_address = p_ip AND attempted_at > now() - interval '1 hour';
  SELECT COUNT(*) INTO email_count FROM public.signup_attempts WHERE email = lower(p_email) AND attempted_at > now() - interval '1 hour';
  result := jsonb_build_object('blocked', (ip_count >= p_max_per_ip_per_hour OR email_count >= p_max_per_email_per_hour),
    'reason', CASE WHEN ip_count >= p_max_per_ip_per_hour THEN 'Too many signup attempts from this network.' WHEN email_count >= p_max_per_email_per_hour THEN 'Too many signup attempts for this email.' ELSE null END,
    'ip_attempts', ip_count, 'email_attempts', email_count);
  RETURN result;
END;
$$;

-- 20240114000000_fix_role_escalation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'student', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()));
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.get_my_role() = 'admin');

-- 20240115000000_unique_enrollment
DELETE FROM public.short_course_enrollments a USING public.short_course_enrollments b WHERE a.course_id = b.course_id AND a.student_id = b.student_id AND a.id > b.id;
ALTER TABLE public.short_course_enrollments ADD CONSTRAINT unique_student_course_enrollment UNIQUE (course_id, student_id);

-- 20240116000000_payment_invoices
CREATE TABLE IF NOT EXISTS public.payment_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.short_course_enrollments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  transaction_id text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('nayapay', 'easypaisa', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  invoice_number text UNIQUE NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason text
);
CREATE INDEX idx_payment_invoices_enrollment ON public.payment_invoices (enrollment_id);
CREATE INDEX idx_payment_invoices_student ON public.payment_invoices (student_id);
CREATE INDEX idx_payment_invoices_status ON public.payment_invoices (status);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, title text NOT NULL, message text NOT NULL,
  metadata jsonb, is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_notifications_read ON public.admin_notifications (is_read, created_at);

ALTER TABLE public.payment_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_invoices_select" ON public.payment_invoices FOR SELECT USING (public.get_my_role() = 'admin' OR student_id = public.get_my_student_id());
CREATE POLICY "payment_invoices_insert" ON public.payment_invoices FOR INSERT WITH CHECK (public.get_my_role() = 'admin' OR student_id = public.get_my_student_id());
CREATE POLICY "payment_invoices_update" ON public.payment_invoices FOR UPDATE USING (public.get_my_role() = 'admin');

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_notifications_select" ON public.admin_notifications FOR SELECT USING (public.get_my_role() = 'admin');
CREATE POLICY "admin_notifications_insert" ON public.admin_notifications FOR INSERT WITH CHECK (public.get_my_role() = 'admin' OR public.get_my_role() = 'student');
CREATE POLICY "admin_notifications_update" ON public.admin_notifications FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE OR REPLACE FUNCTION public.generate_invoice_number() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT 'INV-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || floor(random() * 9000 + 1000)::int;
$$;

-- 20240117000000_downloads_table
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT, category TEXT,
  cover_image_url TEXT, file_url TEXT NOT NULL,
  download_count INTEGER DEFAULT 0, published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published downloads" ON downloads FOR SELECT USING (published = true);
CREATE POLICY "Admin can manage downloads" ON downloads FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE INDEX idx_downloads_created_at ON downloads(created_at DESC) WHERE published = true;


-- ═══════════════════════════════════════════════════════════════
-- PART 5: Fatwa Knowledge Platform & Search
-- ═══════════════════════════════════════════════════════════════

-- 20240118000000_fatwa_knowledge_platform
ALTER TABLE public.fatwa_questions
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS category_1 text,
  ADD COLUMN IF NOT EXISTS category_2 text,
  ADD COLUMN IF NOT EXISTS category_3 text,
  ADD COLUMN IF NOT EXISTS dar_ul_ifta text DEFAULT 'Hidayat Darul Ifta',
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_fatwa_questions_slug ON public.fatwa_questions (slug);
CREATE INDEX IF NOT EXISTS idx_fatwa_questions_category_1 ON public.fatwa_questions (category_1);
CREATE INDEX IF NOT EXISTS idx_fatwa_questions_category_2 ON public.fatwa_questions (category_2);
CREATE INDEX IF NOT EXISTS idx_fatwa_questions_category_3 ON public.fatwa_questions (category_3);
CREATE INDEX IF NOT EXISTS idx_fatwa_questions_published_at ON public.fatwa_questions (published_at);
CREATE INDEX IF NOT EXISTS idx_fatwa_questions_view_count ON public.fatwa_questions (view_count);
CREATE INDEX IF NOT EXISTS idx_fatwa_questions_dar_ul_ifta ON public.fatwa_questions (dar_ul_ifta);
CREATE INDEX IF NOT EXISTS idx_fatwa_questions_categories ON public.fatwa_questions (category_1, category_2, category_3) WHERE status = 'published';

-- 20240119000000_fatwa_public_rls
CREATE POLICY "public_read_published_fatwas" ON public.fatwa_questions FOR SELECT TO anon USING (status = 'published');

-- 20240122000000_fatwa_category_counts_rpc
CREATE OR REPLACE FUNCTION public.get_fatwa_category_counts()
RETURNS TABLE (category_1 text, category_2 text, category_3 text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT category_1, category_2, category_3, COUNT(*)::bigint AS count
  FROM public.fatwas WHERE category_1 IS NOT NULL
  GROUP BY category_1, category_2, category_3
  ORDER BY category_1, category_2, category_3;
$$;

-- 20240123000000_fix_role_escalation_trigger (already applied via handle_new_user above)

-- 20240124000000_student_self_enrollment_rls
CREATE POLICY "short_course_enrollments_student_self_enroll" ON public.short_course_enrollments
  FOR INSERT WITH CHECK (public.get_my_role() = 'student' AND student_id = public.get_my_student_id() AND status = 'pending');

-- ═══════════════════════════════════════════════════════════════
-- PART 6: Enterprise Search Schema
-- ═══════════════════════════════════════════════════════════════

-- 20240201000000_search_phase_a_schema
ALTER TABLE public.fatwas
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fatwas_slug ON public.fatwas (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fatwas_title_trgm ON public.fatwas USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_fatwas_question_trgm ON public.fatwas USING GIN (question gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_fatwas_search_vector ON public.fatwas USING GIN (search_vector);

CREATE TABLE IF NOT EXISTS public.fatwa_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fatwa_id bigint NOT NULL,
  chunk_index int NOT NULL DEFAULT 0,
  content text NOT NULL,
  embedding vector,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (fatwa_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_fatwa_chunks_fatwa_id ON public.fatwa_chunks (fatwa_id);

CREATE TABLE IF NOT EXISTS public.search_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL, expanded_term text NOT NULL,
  weight float NOT NULL DEFAULT 1.0, created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (term, expanded_term)
);
CREATE INDEX IF NOT EXISTS idx_search_synonyms_term ON public.search_synonyms (term);

CREATE TABLE IF NOT EXISTS public.search_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL UNIQUE, frequency int NOT NULL DEFAULT 1,
  source text NOT NULL CHECK (source IN ('title', 'question', 'category', 'popular')),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_term_trgm ON public.search_suggestions USING GIN (term gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_frequency ON public.search_suggestions (frequency DESC);

CREATE TABLE IF NOT EXISTS public.search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL, results_count int NOT NULL DEFAULT 0,
  latency_ms int, filters jsonb, session_id text, created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON public.search_queries (created_at DESC);

CREATE TABLE IF NOT EXISTS public.search_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid REFERENCES public.search_queries(id) ON DELETE CASCADE,
  fatwa_id bigint,
  position int NOT NULL, created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_clicks_query_id ON public.search_clicks (query_id);

ALTER TABLE public.fatwa_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fatwa_chunks_public_read" ON public.fatwa_chunks FOR SELECT USING (true);
CREATE POLICY "fatwa_chunks_admin_write" ON public.fatwa_chunks FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_synonyms_public_read" ON public.search_synonyms FOR SELECT USING (true);
CREATE POLICY "search_synonyms_admin_write" ON public.search_synonyms FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.search_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_suggestions_public_read" ON public.search_suggestions FOR SELECT USING (true);
CREATE POLICY "search_suggestions_admin_write" ON public.search_suggestions FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_queries_insert" ON public.search_queries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "search_queries_select" ON public.search_queries FOR SELECT USING (public.get_my_role() = 'admin');

ALTER TABLE public.search_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_clicks_insert" ON public.search_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "search_clicks_select" ON public.search_clicks FOR SELECT USING (public.get_my_role() = 'admin');


-- ═══════════════════════════════════════════════════════════════
-- PART 7: Search Functions & RPCs
-- ═══════════════════════════════════════════════════════════════

-- Search vector trigger
CREATE OR REPLACE FUNCTION public.fatwas_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.category_1, '') || ' ' || COALESCE(NEW.category_2, '') || ' ' || COALESCE(NEW.category_3, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.question, '')), 'C') ||
    setweight(to_tsvector('simple', left(COALESCE(NEW.answer, ''), 5000)), 'D');
  NEW.search_vector_en :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.question, '')), 'C') ||
    setweight(to_tsvector('english', left(COALESCE(NEW.answer, ''), 5000)), 'D');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fatwas_search_vector ON public.fatwas;
CREATE TRIGGER trg_fatwas_search_vector
  BEFORE INSERT OR UPDATE OF title, question, answer, category_1, category_2, category_3
  ON public.fatwas FOR EACH ROW EXECUTE FUNCTION public.fatwas_search_vector_update();

-- Synonym expansion
CREATE OR REPLACE FUNCTION public.expand_search_query(p_query text)
RETURNS TABLE (term text, weight float) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_query AS term, 1.0::float AS weight
  UNION ALL
  SELECT s.expanded_term, s.weight FROM public.search_synonyms s WHERE s.term = p_query ORDER BY weight DESC LIMIT 10;
$$;

-- Trigram search
CREATE OR REPLACE FUNCTION public.search_fatwas_trigram(
  p_query text, p_limit int DEFAULT 50, p_category_1 text DEFAULT NULL,
  p_category_2 text DEFAULT NULL, p_category_3 text DEFAULT NULL, p_dar_ul_ifta text DEFAULT NULL
) RETURNS TABLE (id bigint, title text, question text, slug text, category_1 text, category_2 text, category_3 text, dar_ul_ifta text, view_count int, created_at timestamptz, trgm_score float)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE raw_query text;
BEGIN
  raw_query := trim(p_query);
  IF raw_query = '' THEN RETURN; END IF;
  PERFORM set_config('pg_trgm.similarity_threshold', '0.15', true);
  RETURN QUERY
  SELECT f.id, f.title, f.question, f.slug, f.category_1, f.category_2, f.category_3, f.dar_ul_ifta, f.view_count, f.created_at,
    GREATEST(similarity(f.title, raw_query), similarity(f.question, raw_query) * 0.8)::float AS trgm_score
  FROM public.fatwas f
  WHERE (f.title % raw_query OR f.question % raw_query OR f.title ILIKE '%' || raw_query || '%' OR f.question ILIKE '%' || raw_query || '%')
    AND (p_category_1 IS NULL OR f.category_1 = p_category_1)
    AND (p_category_2 IS NULL OR f.category_2 = p_category_2)
    AND (p_category_3 IS NULL OR f.category_3 = p_category_3)
    AND (p_dar_ul_ifta IS NULL OR f.dar_ul_ifta = p_dar_ul_ifta)
  ORDER BY trgm_score DESC, f.view_count DESC NULLS LAST LIMIT p_limit;
END;
$$;

-- FTS search (with english stemming)
ALTER TABLE public.fatwas ADD COLUMN IF NOT EXISTS search_vector_en tsvector;
CREATE INDEX IF NOT EXISTS idx_fatwas_search_vector_en ON public.fatwas USING GIN (search_vector_en);

CREATE OR REPLACE FUNCTION public.search_fatwas_fts(
  p_query text, p_limit int DEFAULT 50, p_category_1 text DEFAULT NULL,
  p_category_2 text DEFAULT NULL, p_category_3 text DEFAULT NULL, p_dar_ul_ifta text DEFAULT NULL
) RETURNS TABLE (id bigint, title text, question text, slug text, category_1 text, category_2 text, category_3 text, dar_ul_ifta text, view_count int, created_at timestamp, fts_rank float)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE tsq_simple tsquery; tsq_en tsquery; raw_query text;
BEGIN
  raw_query := trim(p_query); IF raw_query = '' THEN RETURN; END IF;
  BEGIN tsq_simple := plainto_tsquery('simple', raw_query); tsq_en := plainto_tsquery('english', raw_query);
  EXCEPTION WHEN OTHERS THEN RETURN; END;
  IF (tsq_simple IS NULL OR tsq_simple::text = '') AND (tsq_en IS NULL OR tsq_en::text = '') THEN RETURN; END IF;
  RETURN QUERY
  SELECT f.id, f.title::text, f.question::text, f.slug::text, f.category_1::text, f.category_2::text, f.category_3::text, f.dar_ul_ifta::text, f.view_count, f.created_at,
    GREATEST(COALESCE(ts_rank_cd(f.search_vector, tsq_simple, 32), 0), COALESCE(ts_rank_cd(f.search_vector_en, tsq_en, 32), 0))::float AS fts_rank
  FROM public.fatwas f
  WHERE (f.search_vector @@ tsq_simple OR f.search_vector_en @@ tsq_en)
    AND (p_category_1 IS NULL OR f.category_1 = p_category_1)
    AND (p_category_2 IS NULL OR f.category_2 = p_category_2)
    AND (p_category_3 IS NULL OR f.category_3 = p_category_3)
    AND (p_dar_ul_ifta IS NULL OR f.dar_ul_ifta = p_dar_ul_ifta)
  ORDER BY fts_rank DESC LIMIT p_limit;
END;
$$;

-- Vector search
CREATE OR REPLACE FUNCTION public.search_fatwas_vector(
  p_embedding vector, p_limit int DEFAULT 50, p_category_1 text DEFAULT NULL,
  p_category_2 text DEFAULT NULL, p_category_3 text DEFAULT NULL, p_dar_ul_ifta text DEFAULT NULL
) RETURNS TABLE (id bigint, title text, question text, slug text, category_1 text, category_2 text, category_3 text, dar_ul_ifta text, view_count int, created_at timestamptz, vec_score float)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY SELECT DISTINCT ON (f.id) f.id, f.title::text, f.question::text, f.slug::text, f.category_1::text, f.category_2::text, f.category_3::text, f.dar_ul_ifta::text, f.view_count, f.created_at::timestamptz, (1 - (c.embedding <=> p_embedding))::float
  FROM public.fatwa_chunks c JOIN public.fatwas f ON f.id = c.fatwa_id
  WHERE c.embedding IS NOT NULL AND (p_category_1 IS NULL OR f.category_1 = p_category_1) AND (p_category_2 IS NULL OR f.category_2 = p_category_2) AND (p_category_3 IS NULL OR f.category_3 = p_category_3) AND (p_dar_ul_ifta IS NULL OR f.dar_ul_ifta = p_dar_ul_ifta)
  ORDER BY f.id, c.embedding <=> p_embedding LIMIT LEAST(GREATEST(p_limit, 1), 100) * 2;
END;
$$;

-- Snippet generation
CREATE OR REPLACE FUNCTION public.generate_search_snippets(p_fatwa_ids bigint[], p_query text)
RETURNS TABLE (id bigint, snippet_question text, snippet_answer text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE tsquery_val tsquery;
BEGIN
  IF p_query IS NULL OR trim(p_query) = '' THEN
    RETURN QUERY SELECT f.id, left(regexp_replace(COALESCE(f.question,''), '<[^>]*>', '', 'g'), 200), left(regexp_replace(COALESCE(f.answer,''), '<[^>]*>', '', 'g'), 200) FROM public.fatwas f WHERE f.id = ANY(p_fatwa_ids);
    RETURN;
  END IF;
  BEGIN tsquery_val := plainto_tsquery('simple', trim(p_query)); EXCEPTION WHEN OTHERS THEN tsquery_val := plainto_tsquery('simple', trim(p_query)); END;
  IF tsquery_val IS NULL OR tsquery_val::text = '' THEN
    RETURN QUERY SELECT f.id, left(regexp_replace(COALESCE(f.question,''), '<[^>]*>', '', 'g'), 200), left(regexp_replace(COALESCE(f.answer,''), '<[^>]*>', '', 'g'), 200) FROM public.fatwas f WHERE f.id = ANY(p_fatwa_ids);
    RETURN;
  END IF;
  RETURN QUERY SELECT f.id,
    ts_headline('simple', regexp_replace(regexp_replace(COALESCE(f.question,''), '<[^>]*>', '', 'g'), '[<>]', '', 'g'), tsquery_val, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20, MaxFragments=2'),
    ts_headline('simple', regexp_replace(regexp_replace(left(COALESCE(f.answer,''), 3000), '<[^>]*>', '', 'g'), '[<>]', '', 'g'), tsquery_val, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20, MaxFragments=1')
  FROM public.fatwas f WHERE f.id = ANY(p_fatwa_ids);
END;
$$;

-- Related fatwas
CREATE OR REPLACE FUNCTION public.get_related_fatwas(p_fatwa_id bigint, p_limit int DEFAULT 10)
RETURNS TABLE (id bigint, title text, slug text, category_1 text, category_2 text, category_3 text, dar_ul_ifta text, similarity_score float)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE target_embedding vector;
BEGIN
  SELECT c.embedding INTO target_embedding FROM public.fatwa_chunks c WHERE c.fatwa_id = p_fatwa_id AND c.embedding IS NOT NULL ORDER BY c.chunk_index LIMIT 1;
  IF target_embedding IS NULL THEN
    RETURN QUERY SELECT f.id, f.title::text, f.slug::text, f.category_1::text, f.category_2::text, f.category_3::text, f.dar_ul_ifta::text, 0.0::float
    FROM public.fatwas f WHERE f.id <> p_fatwa_id AND f.category_1 = (SELECT target.category_1 FROM public.fatwas AS target WHERE target.id = p_fatwa_id)
    ORDER BY f.view_count DESC NULLS LAST LIMIT LEAST(GREATEST(p_limit, 1), 20);
    RETURN;
  END IF;
  RETURN QUERY SELECT DISTINCT ON (f.id) f.id, f.title::text, f.slug::text, f.category_1::text, f.category_2::text, f.category_3::text, f.dar_ul_ifta::text, (1 - (c.embedding <=> target_embedding))::float
  FROM public.fatwa_chunks c JOIN public.fatwas f ON f.id = c.fatwa_id
  WHERE c.fatwa_id <> p_fatwa_id AND c.embedding IS NOT NULL
  ORDER BY f.id, c.embedding <=> target_embedding LIMIT LEAST(GREATEST(p_limit, 1), 20);
END;
$$;

-- Search suggestions
CREATE OR REPLACE FUNCTION public.get_search_suggestions(p_query text, p_limit int DEFAULT 7)
RETURNS TABLE (term text, frequency int, source text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.term, s.frequency, s.source FROM public.search_suggestions s
  WHERE s.term % p_query OR s.term ILIKE p_query || '%'
  ORDER BY similarity(s.term, p_query) DESC, s.frequency DESC LIMIT p_limit;
$$;

-- Faceted search
CREATE OR REPLACE FUNCTION public.search_fatwas_facets(p_query text)
RETURNS TABLE (facet_type text, facet_value text, count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE raw_query text := trim(p_query);
BEGIN
  IF raw_query = '' THEN RETURN; END IF;
  RETURN QUERY SELECT 'category'::text, f.category_1::text, COUNT(*)::bigint FROM public.fatwas f
  WHERE (f.title % raw_query OR f.question % raw_query OR f.title ILIKE '%' || raw_query || '%') AND f.category_1 IS NOT NULL
  GROUP BY f.category_1 ORDER BY COUNT(*) DESC LIMIT 20;
  RETURN QUERY SELECT 'institution'::text, f.dar_ul_ifta::text, COUNT(*)::bigint FROM public.fatwas f
  WHERE (f.title % raw_query OR f.question % raw_query OR f.title ILIKE '%' || raw_query || '%') AND f.dar_ul_ifta IS NOT NULL
  GROUP BY f.dar_ul_ifta ORDER BY COUNT(*) DESC LIMIT 10;
END;
$$;

-- Analytics logging
CREATE OR REPLACE FUNCTION public.log_search_query(p_query text, p_results_count int DEFAULT 0, p_latency_ms int DEFAULT NULL, p_filters jsonb DEFAULT NULL, p_session_id text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE qid uuid;
BEGIN INSERT INTO public.search_queries (query, results_count, latency_ms, filters, session_id) VALUES (p_query, p_results_count, p_latency_ms, p_filters, p_session_id) RETURNING id INTO qid; RETURN qid;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_search_click(p_query_id uuid, p_fatwa_id bigint, p_position int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN INSERT INTO public.search_clicks (query_id, fatwa_id, position) VALUES (p_query_id, p_fatwa_id, p_position);
END;
$$;

-- Search cache
CREATE TABLE IF NOT EXISTS public.search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash text NOT NULL UNIQUE, results_json jsonb NOT NULL,
  total int NOT NULL DEFAULT 0, mode text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);
CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON public.search_cache (query_hash);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON public.search_cache (expires_at);
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_cache_service_only" ON public.search_cache FOR ALL USING (false);

CREATE OR REPLACE FUNCTION public.search_cache_get(p_query_hash text)
RETURNS TABLE (results_json jsonb, total int, mode text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT sc.results_json, sc.total, sc.mode FROM public.search_cache sc WHERE sc.query_hash = p_query_hash AND sc.expires_at > now() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.search_cache_set(p_query_hash text, p_results_json jsonb, p_total int, p_mode text, p_ttl_seconds int DEFAULT 300)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.search_cache (query_hash, results_json, total, mode, expires_at) VALUES (p_query_hash, p_results_json, p_total, p_mode, now() + (p_ttl_seconds || ' seconds')::interval)
  ON CONFLICT (query_hash) DO UPDATE SET results_json = EXCLUDED.results_json, total = EXCLUDED.total, mode = EXCLUDED.mode, created_at = now(), expires_at = now() + (p_ttl_seconds || ' seconds')::interval;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_cache_cleanup()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE deleted_count int;
BEGIN DELETE FROM public.search_cache WHERE expires_at < now(); GET DIAGNOSTICS deleted_count = ROW_COUNT; RETURN deleted_count;
END;
$$;

-- Seed synonyms
INSERT INTO public.search_synonyms (term, expanded_term, weight) VALUES
  ('طلاق', 'نکاح', 0.7), ('طلاق', 'خلع', 0.6), ('طلاق', 'عدت', 0.5),
  ('divorce', 'طلاق', 0.9), ('divorce', 'نکاح', 0.5), ('talaq', 'طلاق', 1.0),
  ('نکاح', 'شادی', 0.8), ('نکاح', 'مہر', 0.6), ('نکاح', 'ولیمہ', 0.5),
  ('marriage', 'نکاح', 0.9), ('nikah', 'نکاح', 1.0),
  ('نماز', 'عبادات', 0.6), ('نماز', 'وضو', 0.5), ('نماز', 'قبلہ', 0.4),
  ('prayer', 'نماز', 0.9), ('salah', 'نماز', 1.0), ('namaz', 'نماز', 1.0),
  ('زکوٰۃ', 'مالی معاملات', 0.6), ('زکوٰۃ', 'صدقہ', 0.5), ('زکوٰۃ', 'عشر', 0.5), ('zakat', 'زکوٰۃ', 1.0),
  ('روزہ', 'عبادات', 0.5), ('روزہ', 'رمضان', 0.7), ('روزہ', 'افطار', 0.5),
  ('fasting', 'روزہ', 0.9), ('roza', 'روزہ', 1.0),
  ('حج', 'عبادات', 0.5), ('حج', 'عمرہ', 0.7), ('حج', 'قربانی', 0.4), ('hajj', 'حج', 1.0),
  ('وراثت', 'مالی معاملات', 0.6), ('وراثت', 'میراث', 0.9), ('inheritance', 'وراثت', 0.9), ('wirasat', 'وراثت', 1.0),
  ('تجارت', 'مالی معاملات', 0.7), ('تجارت', 'سود', 0.5), ('تجارت', 'بیع', 0.6), ('business', 'تجارت', 0.9),
  ('سود', 'مالی معاملات', 0.7), ('سود', 'تجارت', 0.5), ('interest', 'سود', 0.9), ('riba', 'سود', 1.0),
  ('قربانی', 'عبادات', 0.5), ('قربانی', 'عید الاضحی', 0.7), ('qurbani', 'قربانی', 1.0),
  ('جنازہ', 'موت', 0.6), ('جنازہ', 'تدفین', 0.7), ('janaza', 'جنازہ', 1.0),
  ('حیض', 'حیض و نفاس', 0.9), ('حیض', 'طہارت', 0.6),
  ('وضو', 'طہارت', 0.7), ('وضو', 'نماز', 0.5), ('wudu', 'وضو', 1.0)
ON CONFLICT (term, expanded_term) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- PART 8: LMS Complete
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lecture_id uuid NOT NULL REFERENCES public.course_lectures(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, lecture_id)
);
CREATE INDEX idx_course_progress_student ON public.course_progress (student_id, course_id);
CREATE INDEX idx_course_progress_course ON public.course_progress (course_id);

ALTER TABLE public.short_course_enrollments
  ADD COLUMN IF NOT EXISTS course_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS progress_pct numeric DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  title text NOT NULL, description text,
  passing_score numeric NOT NULL DEFAULT 70, time_limit_minutes int,
  attempts_allowed int DEFAULT 3, randomize_questions boolean NOT NULL DEFAULT false,
  randomize_options boolean NOT NULL DEFAULT false, show_answers_after boolean NOT NULL DEFAULT true,
  show_score_immediately boolean NOT NULL DEFAULT true, required_for_certificate boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quizzes_course ON public.quizzes (course_id);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'essay')),
  question_text text NOT NULL, points numeric NOT NULL DEFAULT 1,
  position int NOT NULL DEFAULT 0, explanation text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_questions_quiz ON public.quiz_questions (quiz_id);

CREATE TABLE IF NOT EXISTS public.quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL, is_correct boolean NOT NULL DEFAULT false, position int NOT NULL DEFAULT 0
);
CREATE INDEX idx_quiz_options_question ON public.quiz_options (question_id);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score numeric, percentage numeric, passed boolean,
  started_at timestamptz NOT NULL DEFAULT now(), submitted_at timestamptz, time_spent_seconds int
);
CREATE INDEX idx_quiz_attempts_student ON public.quiz_attempts (student_id, quiz_id);
CREATE INDEX idx_quiz_attempts_quiz ON public.quiz_attempts (quiz_id);

CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option_id uuid REFERENCES public.quiz_options(id) ON DELETE SET NULL,
  selected_options uuid[], text_answer text, is_correct boolean,
  points_earned numeric DEFAULT 0,
  graded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, graded_at timestamptz
);
CREATE INDEX idx_quiz_answers_attempt ON public.quiz_answers (attempt_id);

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.short_course_enrollments(id) ON DELETE SET NULL,
  certificate_number text UNIQUE NOT NULL, verification_code text UNIQUE NOT NULL,
  student_name text NOT NULL, course_title text NOT NULL, instructor_name text,
  issued_at timestamptz NOT NULL DEFAULT now(), pdf_url text,
  is_active boolean NOT NULL DEFAULT true, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_certificates_student ON public.certificates (student_id);
CREATE INDEX idx_certificates_course ON public.certificates (course_id);
CREATE INDEX idx_certificates_verification ON public.certificates (verification_code);
CREATE INDEX idx_certificates_number ON public.certificates (certificate_number);
CREATE SEQUENCE IF NOT EXISTS certificate_number_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5), review_text text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);
CREATE INDEX idx_course_reviews_course ON public.course_reviews (course_id);

ALTER TABLE public.short_courses
  ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_reviews int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rule text DEFAULT 'all_lectures' CHECK (completion_rule IN ('all_lectures', 'lectures_and_quiz', 'minimum_percentage', 'custom')),
  ADD COLUMN IF NOT EXISTS min_completion_pct numeric DEFAULT 100;

CREATE TABLE IF NOT EXISTS public.course_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  title text NOT NULL, message text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_course_announcements_course ON public.course_announcements (course_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL, title text NOT NULL, message text NOT NULL,
  metadata jsonb, is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_notifications_user ON public.user_notifications (user_id, is_read, created_at DESC);

-- LMS RLS
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_progress_select" ON public.course_progress FOR SELECT USING (public.get_my_role() = 'admin' OR student_id = public.get_my_student_id() OR public.get_my_role() IN ('scholar', 'mufti'));
CREATE POLICY "course_progress_insert" ON public.course_progress FOR INSERT WITH CHECK (student_id = public.get_my_student_id() OR public.get_my_role() = 'admin');
CREATE POLICY "course_progress_delete" ON public.course_progress FOR DELETE USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'admin');

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "quizzes_write" ON public.quizzes FOR ALL USING (public.get_my_role() IN ('admin', 'scholar', 'mufti'));

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_questions_select" ON public.quiz_questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "quiz_questions_write" ON public.quiz_questions FOR ALL USING (public.get_my_role() IN ('admin', 'scholar', 'mufti'));

ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_options_select" ON public.quiz_options FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "quiz_options_write" ON public.quiz_options FOR ALL USING (public.get_my_role() IN ('admin', 'scholar', 'mufti'));

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_attempts_select" ON public.quiz_attempts FOR SELECT USING (public.get_my_role() = 'admin' OR student_id = public.get_my_student_id() OR public.get_my_role() IN ('scholar', 'mufti'));
CREATE POLICY "quiz_attempts_insert" ON public.quiz_attempts FOR INSERT WITH CHECK (student_id = public.get_my_student_id() OR public.get_my_role() = 'admin');
CREATE POLICY "quiz_attempts_update" ON public.quiz_attempts FOR UPDATE USING (student_id = public.get_my_student_id() OR public.get_my_role() IN ('admin', 'scholar', 'mufti'));

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_answers_select" ON public.quiz_answers FOR SELECT USING (public.get_my_role() = 'admin' OR public.get_my_role() IN ('scholar', 'mufti') OR EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_id AND qa.student_id = public.get_my_student_id()));
CREATE POLICY "quiz_answers_insert" ON public.quiz_answers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_id AND qa.student_id = public.get_my_student_id()) OR public.get_my_role() IN ('admin', 'scholar', 'mufti'));
CREATE POLICY "quiz_answers_update" ON public.quiz_answers FOR UPDATE USING (public.get_my_role() IN ('admin', 'scholar', 'mufti'));

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certificates_select" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "certificates_insert" ON public.certificates FOR INSERT WITH CHECK (public.get_my_role() = 'admin' OR student_id = public.get_my_student_id());

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_reviews_select" ON public.course_reviews FOR SELECT USING (true);
CREATE POLICY "course_reviews_insert" ON public.course_reviews FOR INSERT WITH CHECK (student_id = public.get_my_student_id());
CREATE POLICY "course_reviews_update" ON public.course_reviews FOR UPDATE USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'admin');
CREATE POLICY "course_reviews_delete" ON public.course_reviews FOR DELETE USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'admin');

ALTER TABLE public.course_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_announcements_select" ON public.course_announcements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "course_announcements_write" ON public.course_announcements FOR ALL USING (public.get_my_role() IN ('admin', 'scholar', 'mufti'));

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_notifications_select" ON public.user_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_notifications_insert" ON public.user_notifications FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'scholar', 'mufti') OR user_id = auth.uid());
CREATE POLICY "user_notifications_update" ON public.user_notifications FOR UPDATE USING (user_id = auth.uid());

-- LMS helper functions
CREATE OR REPLACE FUNCTION public.generate_certificate_number() RETURNS text LANGUAGE sql AS $$
  SELECT 'HDY-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('certificate_number_seq')::text, 6, '0');
$$;

CREATE OR REPLACE FUNCTION public.generate_verification_code() RETURNS text LANGUAGE sql AS $$
  SELECT 'HDY' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 9));
$$;

CREATE OR REPLACE FUNCTION public.get_course_progress(p_student_id uuid, p_course_id uuid)
RETURNS TABLE (total_lectures int, completed_lectures int, progress_pct numeric) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH totals AS (SELECT COUNT(*)::int AS total FROM public.course_lectures WHERE course_id = p_course_id),
  completed AS (SELECT COUNT(*)::int AS done FROM public.course_progress WHERE student_id = p_student_id AND course_id = p_course_id)
  SELECT totals.total, completed.done, CASE WHEN totals.total > 0 THEN ROUND((completed.done::numeric / totals.total) * 100, 1) ELSE 0 END FROM totals, completed;
$$;

CREATE OR REPLACE FUNCTION public.check_certificate_eligibility(p_student_id uuid, p_course_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rule text; v_min_pct numeric; v_progress_pct numeric; v_quiz_passed boolean;
BEGIN
  SELECT completion_rule, min_completion_pct INTO v_rule, v_min_pct FROM public.short_courses WHERE id = p_course_id;
  SELECT progress_pct INTO v_progress_pct FROM public.get_course_progress(p_student_id, p_course_id);
  SELECT EXISTS (SELECT 1 FROM public.quiz_attempts qa JOIN public.quizzes q ON q.id = qa.quiz_id WHERE qa.student_id = p_student_id AND q.course_id = p_course_id AND q.required_for_certificate = true AND qa.passed = true) INTO v_quiz_passed;
  CASE v_rule
    WHEN 'all_lectures' THEN RETURN v_progress_pct >= 100;
    WHEN 'lectures_and_quiz' THEN RETURN v_progress_pct >= 100 AND v_quiz_passed;
    WHEN 'minimum_percentage' THEN RETURN v_progress_pct >= COALESCE(v_min_pct, 80);
    WHEN 'custom' THEN RETURN v_progress_pct >= COALESCE(v_min_pct, 80) AND v_quiz_passed;
    ELSE RETURN v_progress_pct >= 100;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_certificate(p_code text)
RETURNS TABLE (is_valid boolean, certificate_number text, student_name text, course_title text, instructor_name text, issued_at timestamptz, is_active boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT true, c.certificate_number, c.student_name, c.course_title, c.instructor_name, c.issued_at, c.is_active FROM public.certificates c WHERE c.verification_code = p_code LIMIT 1;
$$;

-- LMS extra tables
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.course_sections(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_section ON public.quizzes (section_id);

ALTER TABLE public.course_progress ADD COLUMN IF NOT EXISTS watch_percent int DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.course_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  title text NOT NULL, description text,
  resource_type text NOT NULL CHECK (resource_type IN ('file','link')),
  url text NOT NULL, created_by uuid REFERENCES public.profiles(id), created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_resources_course ON public.course_resources (course_id, created_at DESC);
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_resources_select" ON public.course_resources FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "course_resources_write" ON public.course_resources FOR ALL USING (public.get_my_role() IN ('admin','scholar','mufti'));

CREATE TABLE IF NOT EXISTS public.course_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.course_discussions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text, body text NOT NULL, created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_discussions_course ON public.course_discussions (course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_discussions_parent ON public.course_discussions (parent_id, created_at);
ALTER TABLE public.course_discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_discussions_select" ON public.course_discussions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "course_discussions_insert" ON public.course_discussions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "course_discussions_update" ON public.course_discussions FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "course_discussions_delete" ON public.course_discussions FOR DELETE USING (auth.uid() = author_id OR public.get_my_role() IN ('admin','scholar','mufti'));


-- ═══════════════════════════════════════════════════════════════
-- PART 9: Platform Features (Revisions, Moderation, Bookmarks, etc.)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.fatwas
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION public.update_fatwas_timestamp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_fatwas_updated_at ON public.fatwas;
CREATE TRIGGER trg_fatwas_updated_at BEFORE UPDATE ON public.fatwas FOR EACH ROW EXECUTE FUNCTION public.update_fatwas_timestamp();

CREATE TABLE IF NOT EXISTS public.fatwa_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fatwa_id uuid NOT NULL REFERENCES public.fatwas(id) ON DELETE CASCADE,
  revision_number int NOT NULL DEFAULT 1, title text, question text, answer text,
  fatwa_ref text, category_1 text, category_2 text, category_3 text, dar_ul_ifta text,
  change_summary text, edited_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(fatwa_id, revision_number)
);
CREATE INDEX idx_fatwa_revisions_fatwa ON public.fatwa_revisions(fatwa_id, revision_number DESC);
ALTER TABLE public.fatwa_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fatwa_revisions_select" ON public.fatwa_revisions FOR SELECT USING (public.get_my_role() IN ('admin', 'mufti'));
CREATE POLICY "fatwa_revisions_insert" ON public.fatwa_revisions FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'mufti'));

-- Content moderation
ALTER TABLE public.fatwa_questions
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending_review' CHECK (moderation_status IN ('pending_review', 'approved', 'rejected', 'flagged', 'spam')),
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS flag_count int NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_fatwa_questions_moderation ON public.fatwa_questions(moderation_status) WHERE is_deleted = false;

CREATE TABLE IF NOT EXISTS public.moderation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.fatwa_questions(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'unflag', 'delete', 'restore', 'mark_spam')),
  reason text, actor_id uuid NOT NULL REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_moderation_log_question ON public.moderation_log(question_id, created_at DESC);
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moderation_log_select" ON public.moderation_log FOR SELECT USING (public.get_my_role() IN ('admin', 'mufti'));
CREATE POLICY "moderation_log_insert" ON public.moderation_log FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'mufti'));

-- User bookmarks
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fatwa_id uuid NOT NULL REFERENCES public.fatwas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, fatwa_id)
);
CREATE INDEX idx_user_bookmarks_user ON public.user_bookmarks(user_id, created_at DESC);
CREATE INDEX idx_user_bookmarks_fatwa ON public.user_bookmarks(fatwa_id);
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_select" ON public.user_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert" ON public.user_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete" ON public.user_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Saved searches
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL, category_1 text, category_2 text, category_3 text,
  keywords text, notify_email boolean NOT NULL DEFAULT true, is_active boolean NOT NULL DEFAULT true,
  last_notified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_saved_searches_user ON public.saved_searches(user_id, is_active);
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_searches_select" ON public.saved_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_searches_insert" ON public.saved_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_searches_update" ON public.saved_searches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "saved_searches_delete" ON public.saved_searches FOR DELETE USING (auth.uid() = user_id);

-- Bulk import
CREATE TABLE IF NOT EXISTS public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, source_type text NOT NULL DEFAULT 'csv' CHECK (source_type IN ('csv', 'json', 'manual')),
  total_rows int NOT NULL DEFAULT 0, valid_rows int NOT NULL DEFAULT 0,
  invalid_rows int NOT NULL DEFAULT 0, published_rows int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'staged' CHECK (status IN ('staged', 'validating', 'validated', 'publishing', 'published', 'failed')),
  imported_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.import_staged_fatwas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  row_number int NOT NULL, title text, question text, answer text,
  fatwa_ref text, category_1 text, category_2 text, category_3 text,
  dar_ul_ifta text, slug text, is_valid boolean DEFAULT false,
  validation_errors jsonb DEFAULT '[]'::jsonb, is_published boolean DEFAULT false,
  published_fatwa_id uuid REFERENCES public.fatwas(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_import_staged_batch ON public.import_staged_fatwas(batch_id, row_number);
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_staged_fatwas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_batches_all" ON public.import_batches FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "import_staged_all" ON public.import_staged_fatwas FOR ALL USING (public.get_my_role() = 'admin');

-- Certificate HMAC
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS signature text, ADD COLUMN IF NOT EXISTS signed_at timestamptz;

-- ═══════════════════════════════════════════════════════════════
-- PART 10: Admin Dashboard RPCs
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_kpis()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb; v_total_students int; v_active_students int; v_total_scholars int; v_total_courses int; v_active_enrollments int; v_completed_enrollments int; v_certificates_issued int; v_pending_questions int; v_published_fatwas int; v_total_publications int; v_pending_payments int; v_students_this_month int; v_enrollments_this_month int; v_revenue_this_month numeric;
BEGIN
  SELECT COUNT(*) INTO v_total_students FROM public.students;
  SELECT COUNT(*) INTO v_active_students FROM public.students WHERE status = 'active';
  SELECT COUNT(*) INTO v_total_scholars FROM public.scholars WHERE employment_status = 'active';
  SELECT COUNT(*) INTO v_total_courses FROM public.short_courses WHERE status = 'published' OR status IS NULL;
  SELECT COUNT(*) INTO v_active_enrollments FROM public.short_course_enrollments WHERE status = 'active';
  SELECT COUNT(*) INTO v_completed_enrollments FROM public.short_course_enrollments WHERE status = 'completed';
  SELECT COUNT(*) INTO v_certificates_issued FROM public.certificates WHERE is_active = true;
  SELECT COUNT(*) INTO v_pending_questions FROM public.fatwa_questions WHERE status IN ('pending', 'assigned');
  SELECT COUNT(*) INTO v_published_fatwas FROM public.fatwas;
  SELECT COUNT(*) INTO v_total_publications FROM public.publications WHERE status = 'published';
  SELECT COUNT(*) INTO v_pending_payments FROM public.short_course_enrollments WHERE status = 'pending';
  SELECT COUNT(*) INTO v_students_this_month FROM public.students WHERE created_at >= date_trunc('month', now());
  SELECT COUNT(*) INTO v_enrollments_this_month FROM public.short_course_enrollments WHERE enrolled_at >= date_trunc('month', now())::date;
  SELECT COALESCE(SUM(sc.fee), 0) INTO v_revenue_this_month FROM public.short_course_enrollments sce JOIN public.short_courses sc ON sc.id = sce.course_id WHERE sce.status IN ('active', 'completed') AND sce.enrolled_at >= date_trunc('month', now())::date;
  result := jsonb_build_object('total_students', v_total_students, 'active_students', v_active_students, 'total_scholars', v_total_scholars, 'total_courses', v_total_courses, 'active_enrollments', v_active_enrollments, 'completed_enrollments', v_completed_enrollments, 'certificates_issued', v_certificates_issued, 'pending_questions', v_pending_questions, 'published_fatwas', v_published_fatwas, 'total_publications', v_total_publications, 'pending_payments', v_pending_payments, 'students_this_month', v_students_this_month, 'enrollments_this_month', v_enrollments_this_month, 'revenue_this_month', v_revenue_this_month);
  RETURN result;
END;
$$;

-- Enrollment delete policy
DROP POLICY IF EXISTS "short_course_enrollments_delete" ON public.short_course_enrollments;
CREATE POLICY "short_course_enrollments_delete" ON public.short_course_enrollments FOR DELETE USING (public.get_my_role() = 'admin');

-- Search hardening
ALTER TABLE public.search_queries ADD COLUMN IF NOT EXISTS cache_hit boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.increment_fatwa_view(p_fatwa_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE was_updated boolean;
BEGIN UPDATE public.fatwas SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_fatwa_id RETURNING true INTO was_updated; RETURN COALESCE(was_updated, false);
END;
$$;

CREATE INDEX IF NOT EXISTS idx_fatwa_questions_active_status ON public.fatwa_questions(status, created_at DESC) WHERE is_deleted = false;

-- ═══════════════════════════════════════════════════════════════
-- DONE! All schema, tables, RLS policies, and functions created.
-- ═══════════════════════════════════════════════════════════════

-- ============================================================
-- Hidayat — Initial Schema
-- Migration: 20240101000000_initial_schema.sql
-- ============================================================

-- ─── Core Identity Tables ────────────────────────────────────

-- Extends Supabase Auth users with role (Req 1.1, 1.2)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('admin','scholar','mufti','student')),
  full_name   text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Auto-insert profile row on new user sign-up (Req 1.2)
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

-- Index for fast student search (Req 10.4 — must return within 2s for 10k records)
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

-- ─── Config Tables ────────────────────────────────────────────

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

-- ─── Dars-e-Nizami Tables ─────────────────────────────────────

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

-- ─── Hifz Tables ──────────────────────────────────────────────

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

-- ─── Nazra Tables ─────────────────────────────────────────────

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

-- ─── Short Courses Tables ─────────────────────────────────────

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

-- ─── Darul Ifta Tables ────────────────────────────────────────

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

-- ─── Research Center Tables ───────────────────────────────────

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

-- ─── Wazifa Tables ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wazifa_evaluations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid REFERENCES public.students(id) ON DELETE CASCADE,
  rule_version    integer NOT NULL,
  eligible        boolean NOT NULL,
  stipend_amount  numeric,
  evaluated_at    timestamptz DEFAULT now()
);

-- ─── Audit / Status History Tables ───────────────────────────

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


-- ─── Scholar Assignment Tables ────────────────────────────────

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

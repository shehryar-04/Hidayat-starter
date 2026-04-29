-- ============================================================
-- Short Courses Extended Schema
-- Migration: 20240104000000_short_courses_extended.sql
-- ============================================================

-- ─── Extend short_courses with all new fields ────────────────
ALTER TABLE public.short_courses
  ADD COLUMN IF NOT EXISTS subtitle             text,
  ADD COLUMN IF NOT EXISTS category             text,
  ADD COLUMN IF NOT EXISTS subcategory          text,
  ADD COLUMN IF NOT EXISTS tags                 text[],
  ADD COLUMN IF NOT EXISTS language             text NOT NULL DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS level                text NOT NULL DEFAULT 'All levels'
                                                  CHECK (level IN ('Beginner','Intermediate','Advanced','All levels')),
  ADD COLUMN IF NOT EXISTS learning_objectives  text[],   -- "What you will learn" bullets
  ADD COLUMN IF NOT EXISTS requirements         text[],   -- Prerequisites / prior knowledge
  ADD COLUMN IF NOT EXISTS thumbnail_url        text,     -- Course thumbnail image (Storage)
  ADD COLUMN IF NOT EXISTS promo_video_url      text,     -- Promotional video URL
  ADD COLUMN IF NOT EXISTS is_free              boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qa_enabled           boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS announcements_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS comments_enabled     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS status               text NOT NULL DEFAULT 'draft'
                                                  CHECK (status IN ('draft','published','archived'));

-- ─── Course sections ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_sections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  title        text NOT NULL,
  position     integer NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON public.course_sections(course_id);

-- ─── Course lectures ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_lectures (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id       uuid NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  course_id        uuid NOT NULL REFERENCES public.short_courses(id) ON DELETE CASCADE,
  title            text NOT NULL,
  position         integer NOT NULL DEFAULT 0,
  content_text     text,                -- optional rich-text content
  video_url        text,                -- Storage path or external URL
  duration_minutes integer,
  is_free_preview  boolean NOT NULL DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_lectures_section_id ON public.course_lectures(section_id);
CREATE INDEX IF NOT EXISTS idx_course_lectures_course_id  ON public.course_lectures(course_id);

-- ─── Lecture resources (PDFs, links, files) ──────────────────
CREATE TABLE IF NOT EXISTS public.lecture_resources (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id   uuid NOT NULL REFERENCES public.course_lectures(id) ON DELETE CASCADE,
  title        text NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('file','link')),
  url          text NOT NULL,           -- Storage path or external link
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lecture_resources_lecture_id ON public.lecture_resources(lecture_id);

-- ─── RLS ─────────────────────────────────────────────────────

-- course_sections
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_sections_select" ON public.course_sections
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "course_sections_write" ON public.course_sections
  FOR ALL USING (
    public.get_my_role() IN ('admin','scholar','mufti')
  );

-- course_lectures
ALTER TABLE public.course_lectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_lectures_select" ON public.course_lectures
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "course_lectures_write" ON public.course_lectures
  FOR ALL USING (
    public.get_my_role() IN ('admin','scholar','mufti')
  );

-- lecture_resources
ALTER TABLE public.lecture_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecture_resources_select" ON public.lecture_resources
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "lecture_resources_write" ON public.lecture_resources
  FOR ALL USING (
    public.get_my_role() IN ('admin','scholar','mufti')
  );

-- Allow scholars to insert short_courses (currently only admin can)
DROP POLICY IF EXISTS "short_courses_insert" ON public.short_courses;
CREATE POLICY "short_courses_insert" ON public.short_courses
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('admin','scholar','mufti')
  );

-- Allow scholars to update their own courses
DROP POLICY IF EXISTS "short_courses_update" ON public.short_courses;
CREATE POLICY "short_courses_update" ON public.short_courses
  FOR UPDATE USING (
    public.get_my_role() = 'admin'
    OR created_by = auth.uid()
  );

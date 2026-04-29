-- ============================================================
-- Hidayat — Seed Data
-- Seeds all 8 feature flags with enabled = true (Req 3.5)
-- ============================================================

INSERT INTO public.feature_flags (module, enabled) VALUES
  ('dars_e_nizami',   true),
  ('hifz',            true),
  ('nazra',           true),
  ('short_courses',   true),
  ('darul_ifta',      true),
  ('research_center', true),
  ('wazifa',          true),
  ('student_reports', true)
ON CONFLICT (module) DO UPDATE SET enabled = EXCLUDED.enabled;

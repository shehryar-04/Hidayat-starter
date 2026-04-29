-- Add 'pending_approval' to the short_courses status check constraint
-- Migration: 20240109000000_course_pending_approval.sql

ALTER TABLE public.short_courses DROP CONSTRAINT IF EXISTS short_courses_status_check;
ALTER TABLE public.short_courses ADD CONSTRAINT short_courses_status_check
  CHECK (status IN ('draft', 'pending_approval', 'published', 'archived'));

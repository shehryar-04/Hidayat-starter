-- Add 'pending' status to short_course_enrollments
-- Migration: 20240110000000_enrollment_approval.sql

-- Drop and recreate the check constraint to include 'pending'
ALTER TABLE public.short_course_enrollments DROP CONSTRAINT IF EXISTS short_course_enrollments_status_check;

-- The status column currently allows: active, completed, incomplete
-- Add 'pending' for enrollment approval workflow
ALTER TABLE public.short_course_enrollments ADD CONSTRAINT short_course_enrollments_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'incomplete'));

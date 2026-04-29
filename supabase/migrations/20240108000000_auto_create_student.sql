-- ============================================================
-- Auto-create a students row when a profile with role='student' is inserted
-- Migration: 20240108000000_auto_create_student.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_student_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create a student row if the role is 'student'
  IF NEW.role = 'student' THEN
    INSERT INTO public.students (
      profile_id,
      enrollment_number,
      enrollment_date,
      status
    ) VALUES (
      NEW.id,
      'STU-' || EXTRACT(EPOCH FROM now())::bigint || '-' || floor(random() * 9000 + 1000)::int,
      CURRENT_DATE,
      'active'
    )
    ON CONFLICT DO NOTHING;  -- safe if row already exists
  END IF;

  RETURN NEW;
END;
$$;

-- Fire after a profile row is inserted
DROP TRIGGER IF EXISTS on_student_profile_created ON public.profiles;
CREATE TRIGGER on_student_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_profile();

-- Also handle the case where an admin changes an existing profile's role to 'student'
DROP TRIGGER IF EXISTS on_profile_role_changed_to_student ON public.profiles;
CREATE TRIGGER on_profile_role_changed_to_student
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'student' AND OLD.role IS DISTINCT FROM 'student')
  EXECUTE FUNCTION public.handle_new_student_profile();

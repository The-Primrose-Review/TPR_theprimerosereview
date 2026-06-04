-- Fix infinite recursion: teacher_profiles policies directly queried profiles,
-- which triggered profiles RLS, which queried teacher_profiles → cycle.
-- Solution: replace direct profiles subqueries with get_current_user_school_id() (SECURITY DEFINER).

DROP POLICY IF EXISTS "Counselors and principals can view teacher profiles at their school" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Students can view teachers at their school" ON public.teacher_profiles;

CREATE POLICY "Counselors and principals can view teacher profiles at their school"
  ON public.teacher_profiles FOR SELECT
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Students can view teachers at their school"
  ON public.teacher_profiles FOR SELECT
  USING (school_id = public.get_current_user_school_id());

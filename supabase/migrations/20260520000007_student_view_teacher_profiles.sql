-- Helper to get current user's school_id without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Allow students (and any authenticated user) to read the profiles row
-- for teachers at their school, so the essay recipient picker can show names.
CREATE POLICY "Users can view teacher profiles at their school"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    WHERE tp.user_id = profiles.user_id
      AND tp.school_id = public.get_current_user_school_id()
  )
);

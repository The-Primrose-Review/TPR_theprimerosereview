-- Counselors were missing INSERT on student_profiles (upsert fails when no row exists)
-- and UPDATE on profiles (full_name update was blocked).

-- 1. Allow counselors to insert a student_profiles row for their assigned students
CREATE POLICY "Counselors can insert their students student_profiles"
  ON public.student_profiles FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'counselor')
    AND public.is_student_counselor(auth.uid(), user_id)
  );

-- 2. Allow counselors to update full_name (and other fields) on their students' profiles
CREATE POLICY "Counselors can update their students profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'counselor')
    AND public.is_student_counselor(auth.uid(), user_id)
  );

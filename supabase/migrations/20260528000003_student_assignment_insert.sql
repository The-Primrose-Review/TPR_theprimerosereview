-- Students need to insert their own counselor assignment during signup via invite link.
-- The existing INSERT policy only allows counselors; this adds the student-side permission.
CREATE POLICY "Students can create their own assignment"
ON public.student_counselor_assignments FOR INSERT
WITH CHECK (student_id = auth.uid());

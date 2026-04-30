-- Allow students to create their own tasks (counselor_id will be null for self-created tasks)
CREATE POLICY "Students can insert their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Allow students to delete tasks they created themselves (not counselor-assigned ones)
CREATE POLICY "Students can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (student_id = auth.uid() AND counselor_id IS NULL);

CREATE POLICY "Students can update their own evaluation results"
  ON evaluation_results
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);
  
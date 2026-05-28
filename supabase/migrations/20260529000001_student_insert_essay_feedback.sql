-- Allow students to create their own essay drafts
create policy "Students can insert their own essays"
  on public.essay_feedback for insert
  with check (student_id = auth.uid());

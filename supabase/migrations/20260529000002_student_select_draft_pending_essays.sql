-- Allow students to see their own drafts and pending essays
create policy "Students can view their own drafts and pending"
  on public.essay_feedback for select
  using (student_id = auth.uid() and status in ('draft', 'pending'));

-- Store target school and word limit separately so drafts can be fully restored
alter table public.essay_feedback
  add column if not exists target_school text,
  add column if not exists word_limit    integer;

-- Allow students to update their own essays (needed to save/submit drafts)
create policy "Students can update their own essays"
  on public.essay_feedback for update
  using  (student_id = auth.uid())
  with check (student_id = auth.uid());

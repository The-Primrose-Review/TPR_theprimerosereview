-- Fix application_essay slots that are stuck on 'draft' despite the essay
-- having been submitted (essay_feedback.status = pending/sent/read).
-- Root cause: SubmitEssay was incorrectly setting slot status to 'draft' on submit.
update application_essays ae
set status = 'in_review', updated_at = now()
where ae.status = 'draft'
  and ae.essay_feedback_id is not null
  and exists (
    select 1 from essay_feedback ef
    where ef.id = ae.essay_feedback_id
      and ef.status in ('pending', 'sent', 'read')
  );

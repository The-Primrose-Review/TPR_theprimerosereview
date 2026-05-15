-- Replace the single target_country / target_college columns on student_profiles
-- with a proper one-to-many table so students can have multiple target colleges.

create table student_target_colleges (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(user_id) on delete cascade,
  country    text,
  college    text not null,
  created_at timestamptz default now()
);

-- Migrate any existing single-college rows before dropping the old columns
insert into student_target_colleges (student_id, country, college)
select user_id, target_country, target_college
from   student_profiles
where  target_college is not null;

alter table student_profiles
  drop column if exists target_country,
  drop column if exists target_college;

-- RLS -----------------------------------------------------------------------
alter table student_target_colleges enable row level security;

-- Students: full access to their own rows
create policy "Students manage their own target colleges"
  on student_target_colleges for all
  using      (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- Counselors & principals: full access (needed when counselor manually adds a student)
create policy "Counselors manage target colleges"
  on student_target_colleges for all
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
        and role in ('counselor', 'principal')
    )
  )
  with check (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
        and role in ('counselor', 'principal')
    )
  );

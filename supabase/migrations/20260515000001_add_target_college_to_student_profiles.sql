alter table student_profiles
  add column if not exists target_country text,
  add column if not exists target_college text;

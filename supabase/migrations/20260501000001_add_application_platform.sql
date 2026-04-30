alter table public.applications
  add column if not exists application_platform text;

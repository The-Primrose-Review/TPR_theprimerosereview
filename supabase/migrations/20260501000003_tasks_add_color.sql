alter table public.tasks
  add column if not exists color text not null default 'blue';

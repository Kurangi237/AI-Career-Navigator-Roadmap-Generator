-- Contest engine tables (schedule, registration, submissions, leaderboard entries)
-- Run after 001/002/003 migrations

create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_time timestamptz not null,
  duration_minutes int not null default 90,
  status text not null default 'upcoming',
  created_by uuid references auth.users
);

create table if not exists public.contest_problems (
  contest_id uuid not null references public.contests(id) on delete cascade,
  problem_id text not null,
  slot_order int not null check (slot_order between 1 and 4),
  base_points int not null check (base_points in (3, 4, 5, 7)),
  primary key (contest_id, slot_order)
);

create table if not exists public.contest_registrations (
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  registered_at timestamptz not null default now(),
  primary key (contest_id, user_id)
);

create table if not exists public.contest_submissions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id text not null,
  status text not null check (status in ('AC', 'WA', 'TLE', 'RE')),
  submitted_at timestamptz not null default now(),
  is_ac boolean not null default false
);

create table if not exists public.contest_entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  total_points int not null default 0,
  penalty_minutes int not null default 0,
  finish_time_ms bigint not null default 0,
  tiebreaker bigint not null default 0,
  virtual boolean not null default false,
  submitted_at timestamptz not null default now(),
  unique (contest_id, user_id, virtual)
);

alter table public.contests enable row level security;
alter table public.contest_problems enable row level security;
alter table public.contest_registrations enable row level security;
alter table public.contest_submissions enable row level security;
alter table public.contest_entries enable row level security;

drop policy if exists "contests_select_all" on public.contests;
create policy "contests_select_all"
on public.contests for select
using (true);

drop policy if exists "contests_insert_signed_in" on public.contests;
create policy "contests_insert_signed_in"
on public.contests for insert
with check (auth.uid() is not null);

drop policy if exists "contest_problems_select_all" on public.contest_problems;
create policy "contest_problems_select_all"
on public.contest_problems for select
using (true);

drop policy if exists "contest_problems_insert_signed_in" on public.contest_problems;
create policy "contest_problems_insert_signed_in"
on public.contest_problems for insert
with check (auth.uid() is not null);

drop policy if exists "contest_registrations_select_all" on public.contest_registrations;
create policy "contest_registrations_select_all"
on public.contest_registrations for select
using (true);

drop policy if exists "contest_registrations_insert_self" on public.contest_registrations;
create policy "contest_registrations_insert_self"
on public.contest_registrations for insert
with check (auth.uid() = user_id);

drop policy if exists "contest_submissions_select_all" on public.contest_submissions;
create policy "contest_submissions_select_all"
on public.contest_submissions for select
using (true);

drop policy if exists "contest_submissions_insert_self" on public.contest_submissions;
create policy "contest_submissions_insert_self"
on public.contest_submissions for insert
with check (auth.uid() = user_id);

drop policy if exists "contest_entries_select_all" on public.contest_entries;
create policy "contest_entries_select_all"
on public.contest_entries for select
using (true);

drop policy if exists "contest_entries_insert_self" on public.contest_entries;
create policy "contest_entries_insert_self"
on public.contest_entries for insert
with check (auth.uid() = user_id);

-- Practice tracker + mentor review baseline
-- Run after 001_auth_rbac.sql and 002_subscription_plan.sql

create extension if not exists "pgcrypto";

create table if not exists public.practice_submissions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  problem_title text not null,
  topic text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  status text not null check (status in ('attempted', 'solved')),
  notes text,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists public.mentor_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.practice_submissions(id) on delete cascade,
  reviewer_email text not null,
  reviewer_role text not null check (reviewer_role in ('mentor', 'admin')),
  comment text not null,
  rating smallint not null check (rating between 1 and 5),
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists idx_practice_submissions_user_email on public.practice_submissions(user_email);
create index if not exists idx_practice_submissions_created_at on public.practice_submissions(created_at desc);
create index if not exists idx_mentor_reviews_submission_id on public.mentor_reviews(submission_id);

alter table public.practice_submissions enable row level security;
alter table public.mentor_reviews enable row level security;

drop policy if exists "practice_submissions_select" on public.practice_submissions;
create policy "practice_submissions_select"
on public.practice_submissions for select
using (
  user_email = coalesce((auth.jwt() ->> 'email'), '')
  or public.current_user_role() in ('mentor', 'admin')
);

drop policy if exists "practice_submissions_insert" on public.practice_submissions;
create policy "practice_submissions_insert"
on public.practice_submissions for insert
with check (
  user_email = coalesce((auth.jwt() ->> 'email'), '')
  or public.current_user_role() in ('mentor', 'admin')
);

drop policy if exists "practice_submissions_update" on public.practice_submissions;
create policy "practice_submissions_update"
on public.practice_submissions for update
using (
  user_email = coalesce((auth.jwt() ->> 'email'), '')
  or public.current_user_role() in ('mentor', 'admin')
)
with check (
  user_email = coalesce((auth.jwt() ->> 'email'), '')
  or public.current_user_role() in ('mentor', 'admin')
);

drop policy if exists "mentor_reviews_select" on public.mentor_reviews;
create policy "mentor_reviews_select"
on public.mentor_reviews for select
using (
  public.current_user_role() in ('mentor', 'admin')
  or exists (
    select 1
    from public.practice_submissions ps
    where ps.id = mentor_reviews.submission_id
      and ps.user_email = coalesce((auth.jwt() ->> 'email'), '')
  )
);

drop policy if exists "mentor_reviews_insert" on public.mentor_reviews;
create policy "mentor_reviews_insert"
on public.mentor_reviews for insert
with check (
  public.current_user_role() in ('mentor', 'admin')
);

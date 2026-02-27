-- KARE26 auth + RBAC baseline
-- Run this in Supabase SQL editor before enabling production auth flow.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'mentor', 'student');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role public.app_role not null default 'student',
  avatar_url text,
  target_role text default 'Software Engineer',
  skills text default '',
  joined_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  timestamp bigint not null default (extract(epoch from now()) * 1000)::bigint,
  read boolean not null default false,
  link text,
  priority text,
  category text
);

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'student'::public.app_role);
$$;

alter table public.profiles enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (id = auth.uid() or public.current_user_role() = 'admin')
with check (id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin"
on public.profiles for insert
with check (id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "notifications_select_owner_or_admin_or_mentor" on public.notifications;
create policy "notifications_select_owner_or_admin_or_mentor"
on public.notifications for select
using (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'mentor')
);

drop policy if exists "notifications_insert_owner_or_admin_or_mentor" on public.notifications;
create policy "notifications_insert_owner_or_admin_or_mentor"
on public.notifications for insert
with check (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'mentor')
);

drop policy if exists "notifications_update_owner_or_admin_or_mentor" on public.notifications;
create policy "notifications_update_owner_or_admin_or_mentor"
on public.notifications for update
using (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'mentor')
)
with check (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'mentor')
);

drop policy if exists "notifications_delete_owner_or_admin" on public.notifications;
create policy "notifications_delete_owner_or_admin"
on public.notifications for delete
using (
  user_id = auth.uid()
  or public.current_user_role() = 'admin'
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

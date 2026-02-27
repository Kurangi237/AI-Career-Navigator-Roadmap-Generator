-- Subscription plan baseline for KARE26
-- Run after 001_auth_rbac.sql

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_plan') then
    create type public.subscription_plan as enum ('starter', 'pro', 'business');
  end if;
end $$;

alter table if exists public.profiles
  add column if not exists subscription_plan public.subscription_plan not null default 'starter';

create index if not exists idx_profiles_subscription_plan on public.profiles(subscription_plan);

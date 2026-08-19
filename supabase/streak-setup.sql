-- Account-based daily streak. Run this once in the Supabase SQL editor
-- (Project -> SQL Editor -> New query -> paste -> Run).
-- No migrations folder/tooling exists in this repo yet, so this file is just
-- a plain script to hand-run, matching pdf-store-setup.sql/
-- support-tickets-setup.sql.

alter table profiles add column if not exists streak_count integer not null default 0;
alter table profiles add column if not exists last_streak_date date;

-- Explicit select/update policies for a user's own row, in case the
-- originally hand-set-up `profiles` table doesn't already have them (its
-- existing upsert-on-sign-in from AuthGateContext.jsx implies insert/update
-- already work, but select was never previously exercised from the client).
alter table profiles enable row level security;
drop policy if exists "users can view own profile" on profiles;
create policy "users can view own profile" on profiles
  for select using (auth.uid() = id);
drop policy if exists "users can update own profile" on profiles;
create policy "users can update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

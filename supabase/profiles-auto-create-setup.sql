-- Guarantees every signed-up user has a `profiles` row, regardless of which
-- sign-in path they took. Run this once in the Supabase SQL editor.
--
-- Why this is needed: AuthGateContext.jsx's saveProfileOnSignIn only upserts
-- a profiles row client-side, using the anon/authenticated key — subject to
-- RLS, and its result isn't checked/awaited-on-error, so a blocked insert
-- fails silently. This was discovered because a real, actively-subscribed
-- account had no profiles row at all: it wouldn't have shown up in the admin
-- Users tab, and showed as a raw UUID instead of an email in Subscriptions.
--
-- The fix is a server-side trigger that creates the row the moment Supabase
-- Auth creates the user, with SECURITY DEFINER so it runs with elevated
-- privileges and can never be blocked by RLS — this is the standard
-- Supabase-documented pattern for this exact problem.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- One-time backfill for accounts that signed up before this trigger existed
-- (e.g. the one found and hand-fixed during Phase 3 testing) — safe to
-- re-run, only fills in rows that don't already exist.
insert into public.profiles (id, email)
select id, email from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- Ambassador accounts & referral attribution. Run this once in the Supabase
-- SQL editor, same as every other *-setup.sql file in this repo.

create table if not exists ambassadors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  referral_code text not null unique,
  status text not null default 'active', -- 'active' | 'disabled'
  created_at timestamptz not null default now()
);
alter table ambassadors enable row level security;
-- Deliberately no policies — this table is only ever touched via the
-- service-role key from api/ambassadors.js, same as subscriptions and
-- pdf_store_purchases.

-- Set once at signup from the referral code in the URL the visitor arrived
-- through (see App.jsx + api/ambassadors.js's apply-referral action). Never
-- overwritten once set — attribution lasts for the life of the account.
alter table profiles add column if not exists referred_by_ambassador_id uuid references ambassadors(id);

-- Denormalized onto each subscription at creation time (copied from
-- profiles.referred_by_ambassador_id by api/subscriptions.js's handleCreate)
-- rather than requiring a join back to profiles for every future
-- commission/reporting query.
alter table subscriptions add column if not exists referred_by_ambassador_id uuid references ambassadors(id);

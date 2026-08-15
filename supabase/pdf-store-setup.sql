-- PDF store setup. Run this once in the Supabase SQL editor
-- (Project -> SQL Editor -> New query -> paste -> Run).
-- No migrations folder/tooling exists in this repo yet, so this file is just
-- a plain script to hand-run, matching how `profiles`/`anon_usage`/
-- `ip_daily_usage` were originally set up.

-- 1. Admin gating: set to true manually for your own account after you sign
--    up once through the app (Google or email/password).
alter table profiles add column if not exists is_admin boolean not null default false;
-- update profiles set is_admin = true where email = 'you@example.com';

-- 2. Storage buckets
insert into storage.buckets (id, name, public)
values ('pdf-store-previews', 'pdf-store-previews', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('pdf-store-originals', 'pdf-store-originals', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('pdf-store-locked', 'pdf-store-locked', false)
on conflict (id) do nothing;
-- No storage RLS policies are needed: every upload/download/signed-URL call
-- in api/pdf-store/* goes through the service-role admin client, which
-- bypasses RLS entirely. The two private buckets are never read by anon/
-- authenticated client keys directly.

-- 3. Catalog table
create table if not exists pdf_store_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  from_lang text not null,
  to_lang text not null,
  price_paise integer not null default 9900,
  -- Optional "was" price for a strikethrough discount display (e.g. was ₹399,
  -- now ₹99). Null means no discount badge is shown.
  original_price_paise integer,
  preview_storage_path text not null,
  original_storage_path text not null,
  page_count integer,
  preview_page_count integer not null default 3,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table pdf_store_items enable row level security;
drop policy if exists "public can read active items" on pdf_store_items;
create policy "public can read active items" on pdf_store_items
  for select using (is_active = true);
-- Inserts/updates only ever happen via the service-role key (admin-finalize
-- route), so no insert/update policy is needed for anon/authenticated roles.

-- 4. Purchases table
create table if not exists pdf_store_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  pdf_id uuid not null references pdf_store_items(id),
  razorpay_order_id text not null,
  razorpay_payment_id text,
  status text not null default 'created', -- 'created' | 'paid' | 'failed'
  password_ciphertext text,
  password_iv text,
  password_tag text,
  locked_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table pdf_store_purchases enable row level security;
-- Deliberately NO policies at all: this table holds the DRM password
-- (encrypted at rest) and is only ever touched via the service-role key from
-- server routes in api/pdf-store/*.js. No anon/authenticated client key
-- should ever query it directly.

create unique index if not exists pdf_store_purchases_one_paid_per_user_pdf
  on pdf_store_purchases (user_id, pdf_id) where status = 'paid';

-- Migration: run this on its own if pdf_store_items already existed before
-- the "was ₹399, now ₹99" discount display was added.
alter table pdf_store_items add column if not exists original_price_paise integer;

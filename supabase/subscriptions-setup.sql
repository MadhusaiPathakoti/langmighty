-- Subscriptions setup (Mighty Pro / Mighty Premium). Run this once in the
-- Supabase SQL editor, same as every other *-setup.sql file in this repo.

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  tier text not null, -- 'pro' | 'premium'
  razorpay_subscription_id text not null unique,
  status text not null default 'created', -- 'created' | 'active' | 'cancelled' | 'halted' | 'completed'
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table subscriptions enable row level security;
-- Deliberately no policies, same as pdf_store_purchases: this table is only
-- ever touched via the service-role key from api/subscriptions.js. No anon/
-- authenticated client key should ever query it directly.

-- At most one active subscription per user at a time — no upgrade/downgrade
-- proration in this phase, so a second `create` while one is already active
-- is rejected at the API level rather than relying solely on this index, but
-- the index is the actual data-integrity backstop.
create unique index if not exists subscriptions_one_active_per_user
  on subscriptions (user_id) where status = 'active';

-- Premium perk: support tickets from Premium subscribers get bumped priority
-- in the admin inbox (see api/support.js).
alter table support_tickets add column if not exists priority text not null default 'normal';

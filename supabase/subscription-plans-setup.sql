-- Lets an admin reprice Mighty Pro/Premium without a redeploy. Run this once
-- in the Supabase SQL editor, same as every other *-setup.sql file here.
--
-- Razorpay Plans are immutable in amount once created, so "changing a
-- price" (see api/pdf-store/admin.js's update-subscription-price action)
-- creates a brand-new Plan and records it here; new subscriptions then read
-- the plan id + price from this table (see _lib/subscription.js's
-- getActivePlan), falling back to the RAZORPAY_PRO_PLAN_ID/
-- RAZORPAY_PREMIUM_PLAN_ID env vars and the hardcoded TIER_PRICES_PAISE
-- mirror until a row exists for that tier — so this is a no-op until an
-- admin actually reprices something. Existing subscribers keep billing at
-- whatever plan/price they originally signed up under; Razorpay has no
-- in-place amount change for a live subscription either.
create table if not exists subscription_plans (
  tier text primary key check (tier in ('pro', 'premium')),
  razorpay_plan_id text not null,
  price_paise integer not null check (price_paise > 0),
  updated_at timestamptz not null default now()
);
alter table subscription_plans enable row level security;
-- Deliberately no policies — service-role key only, same as subscriptions/pdf_store_purchases.

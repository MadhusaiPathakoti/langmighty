import { getSupabaseAdmin } from "./supabaseAdmin.js";
import { getRedis } from "./redisCache.js";

export const PLAN_IDS = {
  pro: process.env.RAZORPAY_PRO_PLAN_ID,
  premium: process.env.RAZORPAY_PREMIUM_PLAN_ID,
};

// Mirrors the amounts scripts/seedSubscriptionPlans.mjs used to create the
// Razorpay Plans — used for the admin Overview's MRR figure, which doesn't
// need a live Razorpay API round-trip for something that only changes when
// someone deliberately reprices a plan.
export const TIER_PRICES_PAISE = { pro: 9900, premium: 24900 };

// Reads the currently-active Razorpay plan for a tier — the subscription_plans
// table (see supabase/subscription-plans-setup.sql) takes over from the
// RAZORPAY_PRO_PLAN_ID/RAZORPAY_PREMIUM_PLAN_ID env vars the moment an admin
// changes that tier's price for the first time (api/pdf-store/admin.js's
// update-subscription-price). Until then this is a no-op, falling back to the
// env var + the hardcoded TIER_PRICES_PAISE mirror below.
export async function getActivePlan(supabaseAdmin, tier) {
  const { data, error } = await supabaseAdmin
    .from("subscription_plans")
    .select("razorpay_plan_id, price_paise")
    .eq("tier", tier)
    .maybeSingle();
  if (error) throw error;
  if (data) return { planId: data.razorpay_plan_id, pricePaise: data.price_paise };
  return { planId: PLAN_IDS[tier], pricePaise: TIER_PRICES_PAISE[tier] };
}

// Current display/MRR price for both tiers at once — same DB-row-with-
// fallback shape as getActivePlan, just for both tiers in one query. Used by
// the Subscribe page's pricing cards and the admin Overview's MRR estimate.
export async function getTierPricesPaise(supabaseAdmin) {
  const { data, error } = await supabaseAdmin.from("subscription_plans").select("tier, price_paise");
  if (error) throw error;
  const overrides = Object.fromEntries((data || []).map((row) => [row.tier, row.price_paise]));
  return { pro: overrides.pro ?? TIER_PRICES_PAISE.pro, premium: overrides.premium ?? TIER_PRICES_PAISE.premium };
}

const TIER_CACHE_TTL_SECONDS = 300; // 5 min — bounds how stale a just-activated/cancelled tier can be

async function fetchTier(supabaseAdmin, userId) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data?.tier === "pro" || data?.tier === "premium" ? data.tier : "free";
}

// Resolves a signed-in user's current paid tier ('pro' | 'premium' | 'free')
// for usage-limit lookups (see _lib/usageLimits.js). Fails closed to 'free' on
// any error — a Supabase/Redis hiccup should never accidentally grant a
// higher limit than the user is actually paying for. Cached briefly in Redis
// since it's checked on every metered translate/chat/game-content call,
// mirroring isAdminUser's exact caching shape in _lib/adminAuth.js.
export async function getUserTier(userId) {
  const redis = getRedis();
  const cacheKey = `tier:${userId}`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached === "pro" || cached === "premium" || cached === "free") return cached;
    } catch (err) {
      console.error("getUserTier: cache read error:", err);
    }
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return "free";

  let tier = "free";
  try {
    tier = await fetchTier(supabaseAdmin, userId);
  } catch (err) {
    console.error("getUserTier: subscriptions select error:", err);
    return "free";
  }

  if (redis) {
    try {
      await redis.set(cacheKey, tier, { ex: TIER_CACHE_TTL_SECONDS });
    } catch (err) {
      console.error("getUserTier: cache write error:", err);
    }
  }

  return tier;
}

// Invalidates the cached tier immediately — called right after a subscription
// row changes (create/verify/cancel/webhook) so the new limit applies on the
// very next request instead of waiting out the cache TTL.
export async function invalidateTierCache(userId) {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(`tier:${userId}`);
  } catch (err) {
    console.error("invalidateTierCache error:", err);
  }
}

import { getRedis } from "./redisCache.js";

// Daily caps per tier. One place to retune. "game" is per individual game
// (see the `subKey` param below), not a shared pool across all 8 Playground
// games — a limit of 1 means each game can be entered once per day, not
// "1 play total across the whole Playground." `free` also covers admins'
// callers that never reach this function at all — see isAdminUser in
// _lib/adminAuth.js, which bypasses usage limits entirely, unrelated to tier.
const LIMITS = {
  free: { translate: 5, chat: 5, game: 1 },
  pro: { translate: 15, chat: 15, game: 3 },
  premium: { translate: 25, chat: 25, game: 6 },
};

const USAGE_KEY_TTL_SECONDS = 60 * 60 * 24 * 2; // 2 days — outlives the UTC day it's counting
const LIMIT_HIT_KEY_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days of history for pricing decisions

function todayUtcKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Best-effort, fire-and-forget: records that a user was actually turned away
// by a limit, so there's real evidence for tuning limits/prices later even
// though there's no admin screen yet to read it back through.
async function recordLimitHit(redis, feature) {
  try {
    const key = `limit_hits:${feature}:${todayUtcKey()}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, LIMIT_HIT_KEY_TTL_SECONDS);
  } catch (err) {
    console.error("recordLimitHit error:", err);
  }
}

// Same calling convention as _lib/creditGate.js's requireSignedIn: returns
// null and has already written the response when the request should be
// rejected, otherwise returns { used, limit } and the caller should proceed.
// Fails open (allows, logs a warning) if Redis isn't configured, matching
// every other feature's fail-open-on-missing-config behavior in this codebase.
//
// `subKey` meters a narrower bucket than the whole feature — e.g. game-content
// passes the specific game id, since each of the 8 Playground games has its
// own once-per-day cap rather than sharing one pool. `tier` (from
// _lib/subscription.js's getUserTier) picks which row of LIMITS applies —
// callers default to 'free' when they haven't looked up a tier at all.
export async function checkAndConsumeUsage(userId, feature, res, { subKey = null, tier = "free" } = {}) {
  const limit = (LIMITS[tier] || LIMITS.free)[feature];
  const redis = getRedis();

  if (!redis) {
    console.warn(`Usage limits: Redis not configured, allowing "${feature}" request unchecked.`);
    return { used: 0, limit };
  }

  const key = `usage:${feature}:${userId}:${subKey ? `${subKey}:` : ""}${todayUtcKey()}`;

  try {
    const used = await redis.incr(key);
    if (used === 1) await redis.expire(key, USAGE_KEY_TTL_SECONDS);

    if (used > limit) {
      await recordLimitHit(redis, feature);
      res.status(429).json({
        error: "You've reached today's free limit. Upgrade to keep going.",
        code: "LIMIT_REACHED",
        feature,
        limit,
        tier,
      });
      return null;
    }

    return { used, limit };
  } catch (err) {
    console.error(`Usage limit check error for "${feature}":`, err);
    return { used: 0, limit }; // fail open on Redis errors too, same as a missing config
  }
}

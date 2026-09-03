import { getSignedInUser } from "./creditGate.js";
import { getSupabaseAdmin } from "./supabaseAdmin.js";
import { getRedis } from "./redisCache.js";

async function fetchIsAdmin(supabaseAdmin, userId) {
  const { data, error } = await supabaseAdmin.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
  if (error) throw error;
  return Boolean(data?.is_admin);
}

// Every admin-* route re-checks profiles.is_admin server-side on every call —
// never trust a client-side flag. Writes the response and returns null when
// the request should be rejected (401 not signed in, 403 not an admin).
export async function requireAdmin(req, res, supabaseAdmin) {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Server is missing Supabase configuration." });
    return null;
  }

  const user = await getSignedInUser(req, supabaseAdmin);
  if (!user) {
    res.status(401).json({ error: "Please sign in." });
    return null;
  }

  let isAdmin;
  try {
    isAdmin = await fetchIsAdmin(supabaseAdmin, user.id);
  } catch (error) {
    console.error("requireAdmin: profiles select error:", error);
    res.status(500).json({ error: "Could not verify admin access." });
    return null;
  }

  if (!isAdmin) {
    res.status(403).json({ error: "Admin access required." });
    return null;
  }

  return user;
}

const ADMIN_FLAG_CACHE_TTL_SECONDS = 300; // 5 min — bounds how stale a just-granted/revoked admin flag can be

// Best-effort admin check for bypassing free-tier usage limits (see
// _lib/usageLimits.js) on an already-authenticated request — distinct from
// requireAdmin, which gates admin-only routes and writes its own response.
// This never rejects a request; it fails closed to `false` on any lookup
// error so a Supabase/Redis hiccup can never accidentally grant unlimited
// usage. Cached briefly in Redis since it's checked on every metered
// translate/chat/game-content call, not just admin routes.
export async function isAdminUser(userId) {
  const redis = getRedis();
  const cacheKey = `admin_flag:${userId}`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached !== null && cached !== undefined) return Boolean(cached);
    } catch (err) {
      console.error("isAdminUser: cache read error:", err);
    }
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return false;

  let isAdmin = false;
  try {
    isAdmin = await fetchIsAdmin(supabaseAdmin, userId);
  } catch (err) {
    console.error("isAdminUser: profiles select error:", err);
    return false;
  }

  if (redis) {
    try {
      await redis.set(cacheKey, isAdmin, { ex: ADMIN_FLAG_CACHE_TTL_SECONDS });
    } catch (err) {
      console.error("isAdminUser: cache write error:", err);
    }
  }

  return isAdmin;
}

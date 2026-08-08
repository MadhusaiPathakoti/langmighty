import crypto from "node:crypto";
import { getSupabaseAdmin } from "./supabaseAdmin.js";

const FREE_CREDIT_LIMIT = 3;
// Coarser backstop against "open a new incognito window every time" — each fresh
// anon_id only gets FREE_CREDIT_LIMIT, but this caps total anonymous usage per IP
// per day regardless of how many anon_ids it comes from.
const IP_DAILY_LIMIT = 9;
const ANON_COOKIE_NAME = "langlearn_anon_id";
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function setAnonCookie(res, anonId) {
  const cookie = `${ANON_COOKIE_NAME}=${anonId}; Max-Age=${ANON_COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookie);
  } else if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookie]);
  } else {
    res.setHeader("Set-Cookie", [existing, cookie]);
  }
}

async function getSignedInUser(req, supabaseAdmin) {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ") || !supabaseAdmin) return null;
  const token = auth.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// Enforces the free-credit limit server-side, so it can't be bypassed by clearing
// localStorage, opening an incognito tab, or calling the API directly. Tracks
// anonymous usage by an httpOnly cookie (anon_id) plus a per-IP daily cap as a
// backstop against repeatedly discarding that cookie. Signed-in users (verified
// via their Supabase access token) are exempt entirely.
//
// Returns null and has already written the response when the request should be
// rejected. Otherwise returns { signedIn } and the caller should proceed.
export async function enforceCreditGate(req, res) {
  const supabaseAdmin = getSupabaseAdmin();

  const user = await getSignedInUser(req, supabaseAdmin);
  if (user) return { signedIn: true };

  if (!supabaseAdmin) {
    // Fail open rather than break the app if Supabase isn't set up yet — but note
    // this means the gate provides no real protection until it's configured.
    console.warn("Credit gate: Supabase admin client not configured, allowing request unchecked.");
    return { signedIn: false };
  }

  const cookies = parseCookies(req.headers.cookie);
  const anonId = cookies[ANON_COOKIE_NAME] && UUID_RE.test(cookies[ANON_COOKIE_NAME])
    ? cookies[ANON_COOKIE_NAME]
    : crypto.randomUUID();

  const ip = getClientIp(req);
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: anonRow, error: anonErr }, { data: ipRow, error: ipErr }] = await Promise.all([
    supabaseAdmin.from("anon_usage").select("credits_used").eq("anon_id", anonId).maybeSingle(),
    supabaseAdmin.from("ip_daily_usage").select("credits_used").eq("ip", ip).eq("usage_date", today).maybeSingle(),
  ]);
  if (anonErr) console.error("Credit gate: anon_usage select error:", anonErr);
  if (ipErr) console.error("Credit gate: ip_daily_usage select error:", ipErr);

  const anonCredits = anonRow?.credits_used ?? 0;
  const ipCredits = ipRow?.credits_used ?? 0;

  setAnonCookie(res, anonId);

  if (anonCredits >= FREE_CREDIT_LIMIT || ipCredits >= IP_DAILY_LIMIT) {
    res.status(403).json({
      error: "You've used your free prompts. Please sign in to continue.",
      code: "CREDIT_LIMIT_REACHED",
    });
    return null;
  }

  const [{ error: anonUpsertErr }, { error: ipUpsertErr }] = await Promise.all([
    supabaseAdmin
      .from("anon_usage")
      .upsert({ anon_id: anonId, ip, credits_used: anonCredits + 1 }, { onConflict: "anon_id" }),
    supabaseAdmin
      .from("ip_daily_usage")
      .upsert({ ip, usage_date: today, credits_used: ipCredits + 1 }, { onConflict: "ip,usage_date" }),
  ]);
  if (anonUpsertErr) console.error("Credit gate: anon_usage upsert error:", anonUpsertErr);
  if (ipUpsertErr) console.error("Credit gate: ip_daily_usage upsert error:", ipUpsertErr);

  return { signedIn: false };
}

import crypto from "node:crypto";
import { getSupabaseAdmin } from "./supabaseAdmin.js";

const FREE_CREDIT_LIMIT = 3;
// Coarser backstop against "open a new incognito window every time" — each fresh
// anon_id only gets FREE_CREDIT_LIMIT, but this caps total anonymous usage per IP
// per day regardless of how many anon_ids it comes from.
const IP_DAILY_LIMIT = 9;
const ANON_ID_HEADER = "x-anon-id";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

export async function getSignedInUser(req, supabaseAdmin) {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ") || !supabaseAdmin) return null;
  const token = auth.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// Enforces the free-credit limit server-side, so it can't be bypassed by clearing
// localStorage, opening an incognito tab, or calling the API directly. Tracks
// anonymous usage by a client-generated id (sent as the X-Anon-Id header — see
// src/lib/apiClient.js) plus a per-IP daily cap as a backstop against repeatedly
// discarding that id. A header (rather than a cookie the server sets) is used
// because it works identically whether the caller is the web app or a native
// app's WebView calling this API cross-origin, where cookies aren't reliable.
// Signed-in users (verified via their Supabase access token) are exempt entirely.
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

  const headerAnonId = req.headers[ANON_ID_HEADER];
  const anonId = typeof headerAnonId === "string" && UUID_RE.test(headerAnonId) ? headerAnonId : crypto.randomUUID();

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

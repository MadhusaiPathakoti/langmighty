import { getSupabaseAdmin } from "./supabaseAdmin.js";

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

// Requires a signed-in user (verified via their Supabase access token) for
// endpoints that must not be usable anonymously. Fails open if Supabase isn't
// configured yet, matching every other feature in this codebase — but note
// this means the gate provides no real protection until it's configured.
//
// Returns null and has already written the response when the request should
// be rejected. Otherwise returns { signedIn } and the caller should proceed.
export async function requireSignedIn(req, res) {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    console.warn("Auth gate: Supabase admin client not configured, allowing request unchecked.");
    return { signedIn: false };
  }

  const user = await getSignedInUser(req, supabaseAdmin);
  if (!user) {
    res.status(401).json({
      error: "Please sign in to continue.",
      code: "AUTH_REQUIRED",
    });
    return null;
  }

  return { signedIn: true, user };
}

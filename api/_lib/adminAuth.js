import { getSignedInUser } from "./creditGate.js";

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

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("requireAdmin: profiles select error:", error);
    res.status(500).json({ error: "Could not verify admin access." });
    return null;
  }

  if (!profile?.is_admin) {
    res.status(403).json({ error: "Admin access required." });
    return null;
  }

  return user;
}

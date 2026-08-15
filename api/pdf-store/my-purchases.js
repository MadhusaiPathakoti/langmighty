import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { getSignedInUser } from "../_lib/creditGate.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Server is missing Supabase configuration." });
    return;
  }

  const user = await getSignedInUser(req, supabaseAdmin);
  if (!user) {
    res.status(401).json({ error: "Please sign in." });
    return;
  }

  try {
    const [{ data, error }, { data: profile, error: profileErr }] = await Promise.all([
      supabaseAdmin
        .from("pdf_store_purchases")
        .select("pdf_id, created_at, pdf_store_items(title, from_lang, to_lang)")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false }),
      // Piggybacked here rather than a separate round trip — this is the one
      // authenticated PDF-store call the frontend always makes on load, and
      // it's only used to decide whether to show the admin-upload nav entry.
      supabaseAdmin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle(),
    ]);
    if (error) throw error;
    if (profileErr) throw profileErr;

    const purchases = (data || [])
      .filter((row) => row.pdf_store_items)
      .map((row) => ({
        pdfId: row.pdf_id,
        title: row.pdf_store_items.title,
        fromLang: row.pdf_store_items.from_lang,
        toLang: row.pdf_store_items.to_lang,
        purchasedAt: row.created_at,
      }));

    res.status(200).json({ purchases, isAdmin: Boolean(profile?.is_admin) });
  } catch (err) {
    console.error("my-purchases handler error:", err);
    res.status(500).json({ error: "Could not load your purchases." });
  }
}

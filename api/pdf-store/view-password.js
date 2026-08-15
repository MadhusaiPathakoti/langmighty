import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { getSignedInUser } from "../_lib/creditGate.js";
import { decryptPassword } from "../_lib/pdfPassword.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { pdfId } = req.body || {};
  if (!pdfId) {
    res.status(400).json({ error: "Missing pdfId." });
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
    const { data: purchase, error } = await supabaseAdmin
      .from("pdf_store_purchases")
      .select("password_ciphertext, password_iv, password_tag")
      .eq("user_id", user.id)
      .eq("pdf_id", pdfId)
      .eq("status", "paid")
      .maybeSingle();
    if (error) throw error;
    if (!purchase || !purchase.password_ciphertext) {
      res.status(403).json({ error: "You haven't purchased this PDF yet." });
      return;
    }

    const password = decryptPassword({
      ciphertext: purchase.password_ciphertext,
      iv: purchase.password_iv,
      tag: purchase.password_tag,
    });
    res.status(200).json({ password });
  } catch (err) {
    console.error("view-password handler error:", err);
    res.status(500).json({ error: "Could not retrieve your password. Please try again." });
  }
}

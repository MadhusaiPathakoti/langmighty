import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { requireAdmin } from "../_lib/adminAuth.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { pdfId, isActive } = req.body || {};
  if (!pdfId || typeof isActive !== "boolean") {
    res.status(400).json({ error: "Missing pdfId or isActive." });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const admin = await requireAdmin(req, res, supabaseAdmin);
  if (!admin) return;

  try {
    const { error } = await supabaseAdmin
      .from("pdf_store_items")
      .update({ is_active: isActive })
      .eq("id", pdfId);
    if (error) throw error;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("admin-set-active handler error:", err);
    res.status(500).json({ error: "Could not update this PDF." });
  }
}

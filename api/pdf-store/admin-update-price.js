import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { requireAdmin } from "../_lib/adminAuth.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { pdfId, pricePaise, originalPricePaise } = req.body || {};
  if (!pdfId || !Number.isFinite(Number(pricePaise)) || Number(pricePaise) <= 0) {
    res.status(400).json({ error: "Missing pdfId or invalid price." });
    return;
  }
  if (originalPricePaise && Number(originalPricePaise) <= Number(pricePaise)) {
    res.status(400).json({ error: "Original price must be higher than the price." });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const admin = await requireAdmin(req, res, supabaseAdmin);
  if (!admin) return;

  try {
    const { error } = await supabaseAdmin
      .from("pdf_store_items")
      .update({
        price_paise: Math.round(Number(pricePaise)),
        original_price_paise: originalPricePaise ? Math.round(Number(originalPricePaise)) : null,
      })
      .eq("id", pdfId);
    if (error) throw error;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("admin-update-price handler error:", err);
    res.status(500).json({ error: "Could not update the price." });
  }
}

import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { requireAdmin } from "../_lib/adminAuth.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const admin = await requireAdmin(req, res, supabaseAdmin);
  if (!admin) return;

  try {
    const { data: items, error: itemsErr } = await supabaseAdmin
      .from("pdf_store_items")
      .select("id, title, from_lang, to_lang, price_paise, original_price_paise, is_active, created_at")
      .order("created_at", { ascending: false });
    if (itemsErr) throw itemsErr;

    const { data: purchases, error: purchasesErr } = await supabaseAdmin
      .from("pdf_store_purchases")
      .select("pdf_id")
      .eq("status", "paid");
    if (purchasesErr) throw purchasesErr;

    const purchaseCounts = {};
    for (const row of purchases || []) {
      purchaseCounts[row.pdf_id] = (purchaseCounts[row.pdf_id] || 0) + 1;
    }

    const enriched = (items || []).map((item) => ({
      id: item.id,
      title: item.title,
      fromLang: item.from_lang,
      toLang: item.to_lang,
      pricePaise: item.price_paise,
      originalPricePaise: item.original_price_paise,
      isActive: item.is_active,
      purchaseCount: purchaseCounts[item.id] || 0,
    }));

    res.status(200).json({ items: enriched });
  } catch (err) {
    console.error("admin-list handler error:", err);
    res.status(500).json({ error: "Could not load the PDF list." });
  }
}

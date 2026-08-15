import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

const PREVIEW_BUCKET = "pdf-store-previews";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    // Fail open with an empty catalog rather than break the page, matching
    // game-content's convention for an unconfigured backend.
    res.status(200).json({ items: [] });
    return;
  }

  try {
    let query = supabaseAdmin
      .from("pdf_store_items")
      .select(
        "id, title, description, from_lang, to_lang, price_paise, original_price_paise, preview_storage_path, page_count, preview_page_count"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const { from, to } = req.query || {};
    if (typeof from === "string" && from) query = query.eq("from_lang", from);
    if (typeof to === "string" && to) query = query.eq("to_lang", to);

    const { data, error } = await query;
    if (error) throw error;

    const items = (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      fromLang: item.from_lang,
      toLang: item.to_lang,
      pricePaise: item.price_paise,
      originalPricePaise: item.original_price_paise,
      pageCount: item.page_count,
      previewPageCount: item.preview_page_count,
      previewUrl: supabaseAdmin.storage.from(PREVIEW_BUCKET).getPublicUrl(item.preview_storage_path).data
        .publicUrl,
    }));

    res.status(200).json({ items });
  } catch (err) {
    console.error("PDF store list handler error:", err);
    res.status(500).json({ error: "Could not load the PDF store catalog." });
  }
}

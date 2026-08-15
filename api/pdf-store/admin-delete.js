import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { requireAdmin } from "../_lib/adminAuth.js";

const ORIGINALS_BUCKET = "pdf-store-originals";
const PREVIEW_BUCKET = "pdf-store-previews";

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
  const admin = await requireAdmin(req, res, supabaseAdmin);
  if (!admin) return;

  try {
    // Never let a paid-for PDF disappear out from under buyers who already
    // own it — deactivating (hides it from the catalog, keeps downloads
    // working) is the only option once at least one purchase has gone through.
    const { count: paidCount, error: countErr } = await supabaseAdmin
      .from("pdf_store_purchases")
      .select("id", { count: "exact", head: true })
      .eq("pdf_id", pdfId)
      .eq("status", "paid");
    if (countErr) throw countErr;

    if (paidCount > 0) {
      res.status(409).json({
        error: `This PDF has been purchased by ${paidCount} buyer${paidCount === 1 ? "" : "s"} and can't be deleted. Deactivate it instead so they can still download it.`,
      });
      return;
    }

    // Safe to discard abandoned/failed checkout attempts — they hold no
    // download rights, but the foreign key would otherwise block deletion.
    const { error: cleanupErr } = await supabaseAdmin.from("pdf_store_purchases").delete().eq("pdf_id", pdfId);
    if (cleanupErr) throw cleanupErr;

    const { data: item, error: itemErr } = await supabaseAdmin
      .from("pdf_store_items")
      .select("original_storage_path, preview_storage_path")
      .eq("id", pdfId)
      .maybeSingle();
    if (itemErr) throw itemErr;
    if (!item) {
      res.status(404).json({ error: "PDF not found." });
      return;
    }

    const { error: originalRemoveErr } = await supabaseAdmin.storage
      .from(ORIGINALS_BUCKET)
      .remove([item.original_storage_path]);
    if (originalRemoveErr) console.error("admin-delete: could not remove original file:", originalRemoveErr);

    const { error: previewRemoveErr } = await supabaseAdmin.storage
      .from(PREVIEW_BUCKET)
      .remove([item.preview_storage_path]);
    if (previewRemoveErr) console.error("admin-delete: could not remove preview file:", previewRemoveErr);

    const { error: deleteErr } = await supabaseAdmin.from("pdf_store_items").delete().eq("id", pdfId);
    if (deleteErr) throw deleteErr;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("admin-delete handler error:", err);
    res.status(500).json({ error: "Could not delete this PDF." });
  }
}

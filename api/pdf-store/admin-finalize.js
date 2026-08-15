import crypto from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { requireAdmin } from "../_lib/adminAuth.js";

const PREVIEW_BUCKET = "pdf-store-previews";

// Random rather than first-N pages, so the free preview can't be fully
// judged from just the opening pages — picks `count` distinct indices out
// of `pageCount`, returned in ascending order so the preview still reads
// front-to-back.
function pickRandomPageIndices(pageCount, count) {
  const indices = Array.from({ length: pageCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count).sort((a, b) => a - b);
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const {
    title,
    description,
    fromLang,
    toLang,
    pricePaise,
    originalPricePaise,
    previewPageCount,
    originalStoragePath,
  } = req.body || {};

  if (!title || !fromLang || !toLang || !originalStoragePath) {
    res.status(400).json({ error: "Missing required fields." });
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
    const { data: originalBlob, error: downloadErr } = await supabaseAdmin.storage
      .from("pdf-store-originals")
      .download(originalStoragePath);
    if (downloadErr) throw downloadErr;
    const originalBuffer = Buffer.from(await originalBlob.arrayBuffer());

    const sourceDoc = await PDFDocument.load(originalBuffer);
    const pageCount = sourceDoc.getPageCount();
    const previewCount = Math.max(1, Math.min(Number(previewPageCount) || 3, pageCount));

    const previewDoc = await PDFDocument.create();
    const copiedPages = await previewDoc.copyPages(
      sourceDoc,
      pickRandomPageIndices(pageCount, previewCount)
    );
    copiedPages.forEach((page) => previewDoc.addPage(page));
    const previewBytes = await previewDoc.save();

    const previewPath = `${crypto.randomUUID()}.pdf`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(PREVIEW_BUCKET)
      .upload(previewPath, previewBytes, { contentType: "application/pdf", upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("pdf_store_items")
      .insert({
        title,
        description: description || null,
        from_lang: fromLang,
        to_lang: toLang,
        price_paise: Number(pricePaise) || 9900,
        original_price_paise: originalPricePaise ? Number(originalPricePaise) : null,
        preview_storage_path: previewPath,
        original_storage_path: originalStoragePath,
        page_count: pageCount,
        preview_page_count: previewCount,
        is_active: true,
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;

    res.status(200).json({ id: inserted.id });
  } catch (err) {
    console.error("admin-finalize handler error:", err);
    res.status(500).json({ error: err.message || "Could not finalize this PDF." });
  }
}

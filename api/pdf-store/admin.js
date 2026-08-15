import crypto from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { requireAdmin } from "../_lib/adminAuth.js";

const ORIGINALS_BUCKET = "pdf-store-originals";
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

async function handleCreateUploadUrl(supabaseAdmin, body, res) {
  const { fileName } = body;
  if (!fileName || typeof fileName !== "string") {
    res.status(400).json({ error: "Missing fileName." });
    return;
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await supabaseAdmin.storage.from(ORIGINALS_BUCKET).createSignedUploadUrl(path);
  if (error) throw error;

  res.status(200).json({ path, token: data.token, signedUrl: data.signedUrl });
}

async function handleFinalize(supabaseAdmin, body, res) {
  const { title, description, fromLang, toLang, pricePaise, originalPricePaise, previewPageCount, originalStoragePath } =
    body;

  if (!title || !fromLang || !toLang || !originalStoragePath) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }
  if (originalPricePaise && Number(originalPricePaise) <= Number(pricePaise)) {
    res.status(400).json({ error: "Original price must be higher than the price." });
    return;
  }

  const { data: originalBlob, error: downloadErr } = await supabaseAdmin.storage
    .from(ORIGINALS_BUCKET)
    .download(originalStoragePath);
  if (downloadErr) throw downloadErr;
  const originalBuffer = Buffer.from(await originalBlob.arrayBuffer());

  const sourceDoc = await PDFDocument.load(originalBuffer);
  const pageCount = sourceDoc.getPageCount();
  const previewCount = Math.max(1, Math.min(Number(previewPageCount) || 3, pageCount));

  const previewDoc = await PDFDocument.create();
  const copiedPages = await previewDoc.copyPages(sourceDoc, pickRandomPageIndices(pageCount, previewCount));
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
}

async function handleList(supabaseAdmin, res) {
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
}

async function handleUpdatePrice(supabaseAdmin, body, res) {
  const { pdfId, pricePaise, originalPricePaise } = body;
  if (!pdfId || !Number.isFinite(Number(pricePaise)) || Number(pricePaise) <= 0) {
    res.status(400).json({ error: "Missing pdfId or invalid price." });
    return;
  }
  if (originalPricePaise && Number(originalPricePaise) <= Number(pricePaise)) {
    res.status(400).json({ error: "Original price must be higher than the price." });
    return;
  }

  const { error } = await supabaseAdmin
    .from("pdf_store_items")
    .update({
      price_paise: Math.round(Number(pricePaise)),
      original_price_paise: originalPricePaise ? Math.round(Number(originalPricePaise)) : null,
    })
    .eq("id", pdfId);
  if (error) throw error;

  res.status(200).json({ ok: true });
}

async function handleSetActive(supabaseAdmin, body, res) {
  const { pdfId, isActive } = body;
  if (!pdfId || typeof isActive !== "boolean") {
    res.status(400).json({ error: "Missing pdfId or isActive." });
    return;
  }

  const { error } = await supabaseAdmin.from("pdf_store_items").update({ is_active: isActive }).eq("id", pdfId);
  if (error) throw error;

  res.status(200).json({ ok: true });
}

async function handleDelete(supabaseAdmin, body, res) {
  const { pdfId } = body;
  if (!pdfId) {
    res.status(400).json({ error: "Missing pdfId." });
    return;
  }

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
  if (originalRemoveErr) console.error("admin delete: could not remove original file:", originalRemoveErr);

  const { error: previewRemoveErr } = await supabaseAdmin.storage
    .from(PREVIEW_BUCKET)
    .remove([item.preview_storage_path]);
  if (previewRemoveErr) console.error("admin delete: could not remove preview file:", previewRemoveErr);

  const { error: deleteErr } = await supabaseAdmin.from("pdf_store_items").delete().eq("id", pdfId);
  if (deleteErr) throw deleteErr;

  res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { action, ...body } = req.body || {};
  if (!action) {
    res.status(400).json({ error: "Missing action." });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const admin = await requireAdmin(req, res, supabaseAdmin);
  if (!admin) return;

  try {
    switch (action) {
      case "create-upload-url":
        await handleCreateUploadUrl(supabaseAdmin, body, res);
        return;
      case "finalize":
        await handleFinalize(supabaseAdmin, body, res);
        return;
      case "list":
        await handleList(supabaseAdmin, res);
        return;
      case "update-price":
        await handleUpdatePrice(supabaseAdmin, body, res);
        return;
      case "set-active":
        await handleSetActive(supabaseAdmin, body, res);
        return;
      case "delete":
        await handleDelete(supabaseAdmin, body, res);
        return;
      default:
        res.status(400).json({ error: "Unknown action." });
        return;
    }
  } catch (err) {
    console.error(`admin handler error (action=${action}):`, err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
}

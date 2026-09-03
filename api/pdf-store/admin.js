import crypto from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { requireAdmin } from "../_lib/adminAuth.js";
import { TIER_PRICES_PAISE, invalidateTierCache } from "../_lib/subscription.js";

const ORIGINALS_BUCKET = "pdf-store-originals";
const PREVIEW_BUCKET = "pdf-store-previews";

// Random rather than first-N pages, so the free preview can't be fully
// judged from just the opening pages — picks `count` distinct indices out
// of `pageCount`, returned in ascending order so the preview still reads
// front-to-back. Used only as the fallback when the admin doesn't supply an
// explicit page selection.
function pickRandomPageIndices(pageCount, count) {
  const indices = Array.from({ length: pageCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count).sort((a, b) => a - b);
}

// The admin panel lets the page numbers be picked in any click order, so
// this re-derives a clean, validated, ascending, 0-based list from whatever
// 1-based numbers the client sent — never trusting them to already be sane.
function sanitizePageIndices(rawIndices, pageCount) {
  if (!Array.isArray(rawIndices)) return null;
  const unique = [...new Set(rawIndices.map((n) => Math.round(Number(n))))];
  const inRange = unique.filter((n) => Number.isInteger(n) && n >= 1 && n <= pageCount);
  if (inRange.length === 0) return null;
  return inRange.sort((a, b) => a - b);
}

// Shared by finalize (new upload) and regenerate-preview (editing an
// existing item) — builds the preview PDF bytes plus the 1-based page list
// that was actually used, from either an explicit admin-chosen selection or
// (finalize only, as a fallback) a random spread.
async function buildPreview(sourceDoc, pageCount, { previewPageIndices, previewPageCount }) {
  const chosen1Based = sanitizePageIndices(previewPageIndices, pageCount);
  const zeroBasedIndices = chosen1Based
    ? chosen1Based.map((n) => n - 1)
    : pickRandomPageIndices(pageCount, Math.max(1, Math.min(Number(previewPageCount) || 3, pageCount)));

  const previewDoc = await PDFDocument.create();
  const copiedPages = await previewDoc.copyPages(sourceDoc, zeroBasedIndices);
  copiedPages.forEach((page) => previewDoc.addPage(page));
  const previewBytes = await previewDoc.save();

  return { previewBytes, chosenPages: chosen1Based || zeroBasedIndices.map((n) => n + 1) };
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

// Called after the original file lands in storage but before finalize, so
// the admin panel can show a page-picker sized to the real page count
// without having to re-download/re-parse the whole file again at finalize
// time just to know how many pages exist.
async function handleGetPageCount(supabaseAdmin, body, res) {
  const { originalStoragePath } = body;
  if (!originalStoragePath) {
    res.status(400).json({ error: "Missing originalStoragePath." });
    return;
  }

  const { data: originalBlob, error: downloadErr } = await supabaseAdmin.storage
    .from(ORIGINALS_BUCKET)
    .download(originalStoragePath);
  if (downloadErr) throw downloadErr;
  const originalBuffer = Buffer.from(await originalBlob.arrayBuffer());

  const sourceDoc = await PDFDocument.load(originalBuffer);
  res.status(200).json({ pageCount: sourceDoc.getPageCount() });
}

async function handleFinalize(supabaseAdmin, body, res) {
  const {
    title,
    description,
    fromLang,
    toLang,
    pricePaise,
    originalPricePaise,
    previewPageCount,
    previewPageIndices,
    originalStoragePath,
  } = body;

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
  const { previewBytes, chosenPages } = await buildPreview(sourceDoc, pageCount, {
    previewPageIndices,
    previewPageCount,
  });

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
      preview_page_count: chosenPages.length,
      preview_page_indices: chosenPages,
      is_active: true,
    })
    .select("id")
    .single();
  if (insertErr) throw insertErr;

  res.status(200).json({ id: inserted.id });
}

// Rebuilds just the preview PDF for an already-finalized item — lets the
// admin revise which pages are shown for free without re-uploading the
// whole original file. Always requires an explicit selection (unlike
// finalize, this has no random fallback — it's only ever reached from a
// deliberate admin edit, not a first-time upload where a quick default is
// still useful).
async function handleRegeneratePreview(supabaseAdmin, body, res) {
  const { pdfId, previewPageIndices } = body;
  if (!pdfId || !Array.isArray(previewPageIndices) || previewPageIndices.length === 0) {
    res.status(400).json({ error: "Missing pdfId or preview page selection." });
    return;
  }

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

  const { data: originalBlob, error: downloadErr } = await supabaseAdmin.storage
    .from(ORIGINALS_BUCKET)
    .download(item.original_storage_path);
  if (downloadErr) throw downloadErr;
  const originalBuffer = Buffer.from(await originalBlob.arrayBuffer());

  const sourceDoc = await PDFDocument.load(originalBuffer);
  const pageCount = sourceDoc.getPageCount();
  const { previewBytes, chosenPages } = await buildPreview(sourceDoc, pageCount, { previewPageIndices });

  const newPreviewPath = `${crypto.randomUUID()}.pdf`;
  const { error: uploadErr } = await supabaseAdmin.storage
    .from(PREVIEW_BUCKET)
    .upload(newPreviewPath, previewBytes, { contentType: "application/pdf", upsert: true });
  if (uploadErr) throw uploadErr;

  const { error: updateErr } = await supabaseAdmin
    .from("pdf_store_items")
    .update({
      preview_storage_path: newPreviewPath,
      preview_page_count: chosenPages.length,
      preview_page_indices: chosenPages,
      page_count: pageCount,
    })
    .eq("id", pdfId);
  if (updateErr) throw updateErr;

  // Best-effort — an orphaned old preview blob is harmless clutter, not
  // worth failing the whole request over.
  const { error: removeErr } = await supabaseAdmin.storage.from(PREVIEW_BUCKET).remove([item.preview_storage_path]);
  if (removeErr) console.error("regenerate-preview: could not remove old preview file:", removeErr);

  res.status(200).json({ previewPageCount: chosenPages.length, previewPageIndices: chosenPages });
}

async function handleList(supabaseAdmin, res) {
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from("pdf_store_items")
    .select(
      "id, title, description, from_lang, to_lang, price_paise, original_price_paise, is_active, created_at, page_count, preview_page_count, preview_page_indices"
    )
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
    description: item.description,
    fromLang: item.from_lang,
    toLang: item.to_lang,
    pricePaise: item.price_paise,
    originalPricePaise: item.original_price_paise,
    isActive: item.is_active,
    purchaseCount: purchaseCounts[item.id] || 0,
    pageCount: item.page_count,
    previewPageCount: item.preview_page_count,
    previewPageIndices: item.preview_page_indices,
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

async function handleUpdateDetails(supabaseAdmin, body, res) {
  const { pdfId, title, description } = body;
  if (!pdfId || !title || !String(title).trim()) {
    res.status(400).json({ error: "Missing pdfId or title." });
    return;
  }

  const { error } = await supabaseAdmin
    .from("pdf_store_items")
    .update({ title: String(title).trim(), description: description ? String(description).trim() : null })
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

async function handleOverviewStats(supabaseAdmin, res) {
  const [{ data: activeSubs, error: subsErr }, { data: paidPurchases, error: purchasesErr }, ticketsResult] =
    await Promise.all([
      supabaseAdmin.from("subscriptions").select("tier").eq("status", "active"),
      supabaseAdmin.from("pdf_store_purchases").select("pdf_id, pdf_store_items(price_paise)").eq("status", "paid"),
      supabaseAdmin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);
  if (subsErr) throw subsErr;
  if (purchasesErr) throw purchasesErr;
  if (ticketsResult.error) throw ticketsResult.error;

  const subscriberCounts = { pro: 0, premium: 0 };
  for (const row of activeSubs || []) {
    if (row.tier === "pro" || row.tier === "premium") subscriberCounts[row.tier] += 1;
  }
  const mrrPaise = subscriberCounts.pro * TIER_PRICES_PAISE.pro + subscriberCounts.premium * TIER_PRICES_PAISE.premium;
  const pdfRevenuePaise = (paidPurchases || []).reduce((sum, row) => sum + (row.pdf_store_items?.price_paise || 0), 0);

  // Best-effort — listUsers() is capped at 1000 here rather than paginated to
  // completion, so this undercounts past that many total users. Fine at this
  // app's current scale; revisit if the user base grows past it.
  let newSignups7d = 0;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    newSignups7d = (data?.users || []).filter((u) => new Date(u.created_at).getTime() >= cutoff).length;
  } catch (err) {
    console.error("overview-stats: listUsers error:", err);
  }

  res.status(200).json({
    subscriberCounts,
    mrrPaise,
    pdfRevenuePaise,
    openTickets: ticketsResult.count || 0,
    newSignups7d,
  });
}

async function handleListUsers(supabaseAdmin, body, res) {
  const search = typeof body.search === "string" ? body.search.trim() : "";
  let query = supabaseAdmin.from("profiles").select("id, email, is_admin").order("email", { ascending: true }).limit(50);
  if (search) query = query.ilike("email", `%${search}%`);

  const { data: profiles, error: profilesErr } = await query;
  if (profilesErr) throw profilesErr;

  const ids = (profiles || []).map((p) => p.id);
  const subsByUser = {};
  if (ids.length > 0) {
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, tier, razorpay_subscription_id")
      .in("user_id", ids)
      .eq("status", "active");
    if (subsErr) throw subsErr;
    for (const row of subs || []) subsByUser[row.user_id] = row;
  }

  // No bulk "get these N users by id" admin API — bounded to ≤50 (the list
  // limit above) so this stays cheap even done one at a time in parallel.
  const createdAtById = {};
  await Promise.all(
    ids.map(async (id) => {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
        if (error) throw error;
        createdAtById[id] = data.user?.created_at || null;
      } catch (err) {
        console.error(`list-users: getUserById(${id}) failed:`, err);
        createdAtById[id] = null;
      }
    })
  );

  const users = (profiles || []).map((p) => {
    const sub = subsByUser[p.id];
    return {
      id: p.id,
      email: p.email,
      isAdmin: Boolean(p.is_admin),
      tier: sub?.tier || "free",
      isComp: Boolean(sub?.razorpay_subscription_id?.startsWith("comp_")),
      subscriptionId: sub?.id || null,
      createdAt: createdAtById[p.id] || null,
    };
  });

  res.status(200).json({ users });
}

async function handleListSubscriptions(supabaseAdmin, body, res) {
  const { status, tier } = body;
  let query = supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, tier, status, razorpay_subscription_id, created_at, current_period_end")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);
  if (tier) query = query.eq("tier", tier);

  const { data, error } = await query;
  if (error) throw error;

  // subscriptions.user_id references auth.users, not profiles — no FK
  // PostgREST can embed a profiles(email) join through, so email is
  // resolved with its own query and merged in JS instead.
  const userIds = [...new Set((data || []).map((row) => row.user_id))];
  const emailById = {};
  if (userIds.length > 0) {
    const { data: profiles, error: profilesErr } = await supabaseAdmin.from("profiles").select("id, email").in("id", userIds);
    if (profilesErr) throw profilesErr;
    for (const p of profiles || []) emailById[p.id] = p.email;
  }

  const subscriptions = (data || []).map((row) => ({
    id: row.id,
    email: emailById[row.user_id] || row.user_id,
    tier: row.tier,
    status: row.status,
    isComp: Boolean(row.razorpay_subscription_id?.startsWith("comp_")),
    createdAt: row.created_at,
    currentPeriodEnd: row.current_period_end,
  }));

  res.status(200).json({ subscriptions });
}

async function handleGrantComp(supabaseAdmin, body, res) {
  const { userId, tier } = body;
  if (!userId || (tier !== "pro" && tier !== "premium")) {
    res.status(400).json({ error: "Missing userId or invalid tier." });
    return;
  }

  // Same one-active-subscription-per-user guard as api/subscriptions.js's
  // handleCreate — also backstopped by the subscriptions_one_active_per_user
  // partial unique index.
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (existingErr) throw existingErr;
  if (existing) {
    res.status(400).json({ error: "This user already has an active subscription." });
    return;
  }

  // No real Razorpay object — this never touches billing, matching the
  // "comp_" prefix revoke-comp below relies on to stay safe.
  const { error: insertErr } = await supabaseAdmin.from("subscriptions").insert({
    user_id: userId,
    tier,
    razorpay_subscription_id: `comp_${crypto.randomUUID()}`,
    status: "active",
  });
  if (insertErr) throw insertErr;

  await invalidateTierCache(userId);
  res.status(200).json({ ok: true });
}

async function handleRevokeComp(supabaseAdmin, body, res) {
  const { subscriptionId } = body;
  if (!subscriptionId) {
    res.status(400).json({ error: "Missing subscriptionId." });
    return;
  }

  const { data: row, error: rowErr } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, razorpay_subscription_id")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (rowErr) throw rowErr;
  if (!row) {
    res.status(404).json({ error: "Subscription not found." });
    return;
  }
  // Safety rail: only a comp'd row (see grant-comp above) can be revoked
  // this way. A real, Razorpay-backed subscription must be cancelled
  // through Razorpay itself (the Subscribe page's own cancel action) —
  // flipping this row to cancelled without also calling Razorpay would
  // leave the two out of sync while the subscriber keeps getting billed.
  if (!row.razorpay_subscription_id?.startsWith("comp_")) {
    res.status(400).json({ error: "This is a real subscription, not a comp — it can't be revoked from here." });
    return;
  }

  const { error: updateErr } = await supabaseAdmin
    .from("subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", subscriptionId);
  if (updateErr) throw updateErr;

  await invalidateTierCache(row.user_id);
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
      case "get-page-count":
        await handleGetPageCount(supabaseAdmin, body, res);
        return;
      case "regenerate-preview":
        await handleRegeneratePreview(supabaseAdmin, body, res);
        return;
      case "list":
        await handleList(supabaseAdmin, res);
        return;
      case "update-price":
        await handleUpdatePrice(supabaseAdmin, body, res);
        return;
      case "update-details":
        await handleUpdateDetails(supabaseAdmin, body, res);
        return;
      case "set-active":
        await handleSetActive(supabaseAdmin, body, res);
        return;
      case "delete":
        await handleDelete(supabaseAdmin, body, res);
        return;
      case "overview-stats":
        await handleOverviewStats(supabaseAdmin, res);
        return;
      case "list-users":
        await handleListUsers(supabaseAdmin, body, res);
        return;
      case "list-subscriptions":
        await handleListSubscriptions(supabaseAdmin, body, res);
        return;
      case "grant-comp":
        await handleGrantComp(supabaseAdmin, body, res);
        return;
      case "revoke-comp":
        await handleRevokeComp(supabaseAdmin, body, res);
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

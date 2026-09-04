import crypto from "node:crypto";
import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { getSignedInUser } from "../_lib/creditGate.js";
import { getRazorpay } from "../_lib/razorpay.js";
import { encryptPassword, decryptPassword, generatePassword } from "../_lib/pdfPassword.js";
import { lockPdfBuffer } from "../_lib/pdfLock.js";

// Single action-dispatch endpoint, replacing what used to be create-order.js
// and verify-payment.js — api/ is already at Vercel Hobby's 12-Serverless-
// Function cap (see CLAUDE.md), and adding api/ambassadors.js needed a slot
// freed up elsewhere. Same consolidation pattern as admin.js/support.js/
// purchase.js, just for these two checkout-flow steps instead of a broader
// admin surface. Note for `vercel.json`: its `functions` entry (needed for
// muhammara's native binary, used by lockPdfBuffer below) must be keyed to
// this file, not the old verify-payment.js path.

const ORIGINALS_BUCKET = "pdf-store-originals";
const LOCKED_BUCKET = "pdf-store-locked";

function verifySignature(orderId, paymentId, signature, secret) {
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  // Constant-time compare — a plain === on a payment signature invites timing attacks.
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function handleCreateOrder(supabaseAdmin, user, body, res) {
  const { pdfId } = body;
  if (!pdfId) {
    res.status(400).json({ error: "Missing pdfId." });
    return;
  }

  const { data: item, error: itemErr } = await supabaseAdmin
    .from("pdf_store_items")
    .select("id, title, price_paise")
    .eq("id", pdfId)
    .eq("is_active", true)
    .maybeSingle();
  if (itemErr) throw itemErr;
  if (!item) {
    res.status(404).json({ error: "PDF not found." });
    return;
  }

  // Don't let a user pay twice for the same PDF.
  const { data: existingPaid, error: existingErr } = await supabaseAdmin
    .from("pdf_store_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("pdf_id", pdfId)
    .eq("status", "paid")
    .maybeSingle();
  if (existingErr) throw existingErr;
  if (existingPaid) {
    res.status(200).json({ alreadyPurchased: true });
    return;
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(500).json({ error: "Server is missing Razorpay configuration." });
    return;
  }

  const order = await razorpay.orders.create({
    amount: item.price_paise,
    currency: "INR",
    receipt: `pdf_${pdfId}_${user.id}`.slice(0, 40),
    notes: { pdfId, userId: user.id },
  });

  const { error: insertErr } = await supabaseAdmin.from("pdf_store_purchases").insert({
    user_id: user.id,
    pdf_id: pdfId,
    razorpay_order_id: order.id,
    status: "created",
  });
  if (insertErr) throw insertErr;

  res.status(200).json({
    orderId: order.id,
    amountPaise: item.price_paise,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
    title: item.title,
  });
}

async function handleVerifyPayment(supabaseAdmin, user, body, res) {
  const { pdfId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!pdfId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: "Missing payment details." });
    return;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    res.status(500).json({ error: "Server is missing Razorpay configuration." });
    return;
  }

  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret)) {
    res.status(400).json({ error: "Payment verification failed." });
    return;
  }

  const { data: purchase, error: purchaseErr } = await supabaseAdmin
    .from("pdf_store_purchases")
    .select("id, user_id, pdf_id, status, password_ciphertext, password_iv, password_tag")
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();
  if (purchaseErr) throw purchaseErr;
  if (!purchase) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  if (purchase.user_id !== user.id) {
    res.status(403).json({ error: "This order does not belong to your account." });
    return;
  }
  if (purchase.pdf_id !== pdfId) {
    res.status(400).json({ error: "Order does not match this PDF." });
    return;
  }

  // Idempotent: a retried/duplicated call just gets the same password back
  // instead of re-encrypting and re-uploading.
  if (purchase.status === "paid") {
    const password = decryptPassword({
      ciphertext: purchase.password_ciphertext,
      iv: purchase.password_iv,
      tag: purchase.password_tag,
    });
    res.status(200).json({ password });
    return;
  }

  // Atomic status transition guards against a race between two concurrent
  // verify-payment calls for the same order.
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from("pdf_store_purchases")
    .update({ status: "paid", razorpay_payment_id, updated_at: new Date().toISOString() })
    .eq("id", purchase.id)
    .eq("status", "created")
    .select("id")
    .maybeSingle();
  if (claimErr) throw claimErr;

  if (!claimed) {
    // Another concurrent call already claimed it — re-fetch and return its password.
    const { data: nowPaid, error: refetchErr } = await supabaseAdmin
      .from("pdf_store_purchases")
      .select("password_ciphertext, password_iv, password_tag")
      .eq("id", purchase.id)
      .maybeSingle();
    if (refetchErr) throw refetchErr;
    const password = decryptPassword({
      ciphertext: nowPaid.password_ciphertext,
      iv: nowPaid.password_iv,
      tag: nowPaid.password_tag,
    });
    res.status(200).json({ password });
    return;
  }

  const { data: item, error: itemErr } = await supabaseAdmin
    .from("pdf_store_items")
    .select("original_storage_path")
    .eq("id", pdfId)
    .maybeSingle();
  if (itemErr) throw itemErr;
  if (!item) throw new Error("PDF item not found while finalizing purchase.");

  const { data: originalBlob, error: downloadErr } = await supabaseAdmin.storage
    .from(ORIGINALS_BUCKET)
    .download(item.original_storage_path);
  if (downloadErr) throw downloadErr;
  const originalBuffer = Buffer.from(await originalBlob.arrayBuffer());

  const password = generatePassword();
  const lockedBuffer = await lockPdfBuffer(originalBuffer, password);

  const lockedPath = `${purchase.id}.pdf`;
  const { error: uploadErr } = await supabaseAdmin.storage
    .from(LOCKED_BUCKET)
    .upload(lockedPath, lockedBuffer, { contentType: "application/pdf", upsert: true });
  if (uploadErr) throw uploadErr;

  const encrypted = encryptPassword(password);
  const { error: finalizeErr } = await supabaseAdmin
    .from("pdf_store_purchases")
    .update({
      password_ciphertext: encrypted.ciphertext,
      password_iv: encrypted.iv,
      password_tag: encrypted.tag,
      locked_storage_path: lockedPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);
  if (finalizeErr) throw finalizeErr;

  res.status(200).json({ password });
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
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Server is missing Supabase configuration." });
    return;
  }

  const user = await getSignedInUser(req, supabaseAdmin);
  if (!user) {
    res.status(401).json({ error: action === "create-order" ? "Please sign in to buy this PDF." : "Please sign in." });
    return;
  }

  try {
    switch (action) {
      case "create-order":
        await handleCreateOrder(supabaseAdmin, user, body, res);
        return;
      case "verify-payment":
        await handleVerifyPayment(supabaseAdmin, user, body, res);
        return;
      default:
        res.status(400).json({ error: "Unknown action." });
        return;
    }
  } catch (err) {
    console.error(`checkout handler error (action=${action}):`, err);
    // verify-payment deliberately never surfaces err.message here (unlike
    // create-order) — a failure at this stage means the payment already
    // succeeded, so a raw internal error is worse UX than a fixed,
    // reassuring, support-pointing message. Preserved from the original
    // verify-payment.js, which never included err.message at all.
    if (action === "verify-payment") {
      res.status(500).json({ error: "Payment succeeded but we could not prepare your download. Please contact support." });
      return;
    }
    res.status(500).json({ error: err.message || "Could not start the payment. Please try again." });
  }
}

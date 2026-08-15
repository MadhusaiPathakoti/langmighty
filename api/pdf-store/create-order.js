import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { getSignedInUser } from "../_lib/creditGate.js";
import { getRazorpay } from "../_lib/razorpay.js";

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
    res.status(401).json({ error: "Please sign in to buy this PDF." });
    return;
  }

  try {
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
  } catch (err) {
    console.error("create-order handler error:", err);
    res.status(500).json({ error: err.message || "Could not start the payment. Please try again." });
  }
}

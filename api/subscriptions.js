import crypto from "node:crypto";
import Razorpay from "razorpay";
import { applyCors } from "./_lib/cors.js";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getSignedInUser } from "./_lib/creditGate.js";
import { getRazorpay } from "./_lib/razorpay.js";
import { PLAN_IDS, invalidateTierCache } from "./_lib/subscription.js";

// Routes on whether X-Razorpay-Signature is present (see handler() at the
// bottom) rather than being a separate file — api/ is already at Vercel
// Hobby's 12-Serverless-Function cap (see CLAUDE.md), so the webhook and the
// client-facing create/verify/cancel actions have to share this one slot.

const TIERS = new Set(["pro", "premium"]);
// ~10 years of monthly cycles — Razorpay requires a total_count even for an
// effectively-indefinite subscription; the user can still cancel anytime.
const TOTAL_BILLING_CYCLES = 120;

function toIso(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

// Same manual HMAC + constant-time-compare approach as pdf-store/verify-
// payment.js's verifySignature — NOT the SDK's Razorpay.validatePaymentVerification,
// which looks like the "official" way but isn't actually wired up as a static
// method on the Razorpay class in the installed razorpay@2.9.8 (only
// validateWebhookSignature is; validatePaymentVerification exists in the
// utils module but was never exported onto the class). Confirmed by directly
// comparing this manual computation against a real signature from a live
// test payment — it matches; the SDK call was silently throwing instead.
// Field order for Subscriptions is `payment_id|subscription_id` — reversed
// from the Orders flow's `order_id|payment_id`.
function verifySubscriptionSignature(paymentId, subscriptionId, signature, secret) {
  const expected = crypto.createHmac("sha256", secret).update(`${paymentId}|${subscriptionId}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function handleCreate(supabaseAdmin, user, body, res) {
  const { tier } = body;
  if (!TIERS.has(tier)) {
    res.status(400).json({ error: "tier must be 'pro' or 'premium'." });
    return;
  }
  const planId = PLAN_IDS[tier];
  if (!planId) {
    res.status(500).json({ error: `Server is missing the Razorpay plan id for "${tier}".` });
    return;
  }

  // No upgrade/downgrade/proration in this phase — cancel first, then
  // subscribe to the other tier.
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (existingErr) throw existingErr;
  if (existing) {
    res.status(400).json({ error: "You already have an active subscription. Cancel it first to switch plans." });
    return;
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(500).json({ error: "Server is missing Razorpay configuration." });
    return;
  }

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: TOTAL_BILLING_CYCLES,
    notes: { userId: user.id, tier },
  });

  const { error: insertErr } = await supabaseAdmin.from("subscriptions").insert({
    user_id: user.id,
    tier,
    razorpay_subscription_id: subscription.id,
    status: "created",
  });
  if (insertErr) throw insertErr;

  res.status(200).json({ subscriptionId: subscription.id, keyId: process.env.RAZORPAY_KEY_ID, tier });
}

async function handleVerify(supabaseAdmin, user, body, res) {
  const { subscriptionId, razorpay_payment_id, razorpay_signature } = body;
  if (!subscriptionId || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: "Missing payment details." });
    return;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    res.status(500).json({ error: "Server is missing Razorpay configuration." });
    return;
  }

  if (!verifySubscriptionSignature(razorpay_payment_id, subscriptionId, razorpay_signature, keySecret)) {
    res.status(400).json({ error: "Payment verification failed." });
    return;
  }

  const { data: row, error: rowErr } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id")
    .eq("razorpay_subscription_id", subscriptionId)
    .maybeSingle();
  if (rowErr) throw rowErr;
  if (!row) {
    res.status(404).json({ error: "Subscription not found." });
    return;
  }
  if (row.user_id !== user.id) {
    res.status(403).json({ error: "This subscription does not belong to your account." });
    return;
  }

  // Optimistic — the webhook's subscription.activated/charged events are the
  // authoritative follow-up for renewals; this just unblocks the UI now.
  const { error: updateErr } = await supabaseAdmin
    .from("subscriptions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", row.id);
  if (updateErr) throw updateErr;

  await invalidateTierCache(user.id);
  res.status(200).json({ ok: true });
}

async function handleCancel(supabaseAdmin, user, res) {
  const { data: row, error: rowErr } = await supabaseAdmin
    .from("subscriptions")
    .select("id, razorpay_subscription_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (rowErr) throw rowErr;
  if (!row) {
    res.status(404).json({ error: "You don't have an active subscription." });
    return;
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(500).json({ error: "Server is missing Razorpay configuration." });
    return;
  }

  // Cancel at the end of the current billing cycle, not immediately — the
  // user keeps access through what they already paid for. The webhook's
  // subscription.cancelled event is what actually flips `status` once that
  // cycle ends.
  await razorpay.subscriptions.cancel(row.razorpay_subscription_id, { cancel_at_cycle_end: 1 });
  res.status(200).json({ ok: true });
}

async function handleClientAction(req, res, supabaseAdmin) {
  const { action, ...body } = req.body || {};
  if (!action) {
    res.status(400).json({ error: "Missing action." });
    return;
  }

  const user = await getSignedInUser(req, supabaseAdmin);
  if (!user) {
    res.status(401).json({ error: "Please sign in." });
    return;
  }

  try {
    switch (action) {
      case "create":
        await handleCreate(supabaseAdmin, user, body, res);
        return;
      case "verify":
        await handleVerify(supabaseAdmin, user, body, res);
        return;
      case "cancel":
        await handleCancel(supabaseAdmin, user, res);
        return;
      default:
        res.status(400).json({ error: "Unknown action." });
        return;
    }
  } catch (err) {
    console.error(`subscriptions handler error (action=${action}):`, err);
    // The razorpay SDK's own errors aren't standard Error instances — they're
    // shaped like { statusCode, error: { description, code } }, with no
    // top-level .message — so err.message alone silently swallows the real
    // reason (e.g. an invalid plan_id) behind the generic fallback below.
    res.status(500).json({ error: err.message || err.error?.description || "Something went wrong." });
  }
}

// Reads the request stream directly — used only as a fallback for when
// req.rawBody hasn't already been stashed (see vite.config.js's
// prepareApiRequest for the local-dev case). Must run before anything ever
// touches req.body, since a stream can't be read twice.
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const STATUS_BY_EVENT = {
  "subscription.activated": "active",
  "subscription.charged": "active",
  "subscription.completed": "completed",
  "subscription.cancelled": "cancelled",
  "subscription.halted": "halted",
};

async function handleWebhook(req, res, signature, supabaseAdmin) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = req.rawBody ?? (await readRawBody(req).catch(() => null));

  if (!rawBody || !secret) {
    // Fail open on missing config (matches every other feature here), but
    // still 200 so Razorpay doesn't spin retrying forever against a
    // deployment that simply hasn't set the secret up yet.
    console.warn("subscriptions webhook: missing raw body or RAZORPAY_WEBHOOK_SECRET, ignoring.");
    res.status(200).json({ ok: true });
    return;
  }

  let valid = false;
  try {
    valid = Razorpay.validateWebhookSignature(rawBody, signature, secret);
  } catch (err) {
    console.error("subscriptions webhook: signature validation error:", err);
  }
  if (!valid) {
    res.status(400).json({ error: "Invalid webhook signature." });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error("subscriptions webhook: could not parse body:", err);
    res.status(200).json({ ok: true });
    return;
  }

  const entity = payload?.payload?.subscription?.entity;
  const newStatus = STATUS_BY_EVENT[payload?.event];
  if (!entity?.id || !newStatus) {
    // An event type we don't act on (or a malformed payload) — acknowledge
    // anyway so Razorpay doesn't keep retrying something we'll never handle.
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const { data: row, error: rowErr } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id")
      .eq("razorpay_subscription_id", entity.id)
      .maybeSingle();
    if (rowErr) throw rowErr;

    if (row) {
      const { error: updateErr } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: newStatus,
          current_period_end: toIso(entity.current_end),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (updateErr) throw updateErr;
      await invalidateTierCache(row.user_id);
    }
  } catch (err) {
    console.error("subscriptions webhook: DB update error:", err);
    // Still 200 below — Razorpay retrying won't fix a DB error on our end.
  }

  res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Server is missing Supabase configuration." });
    return;
  }

  const signature = req.headers["x-razorpay-signature"];
  if (signature) {
    await handleWebhook(req, res, signature, supabaseAdmin);
    return;
  }

  await handleClientAction(req, res, supabaseAdmin);
}

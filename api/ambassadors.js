import crypto from "node:crypto";
import { applyCors } from "./_lib/cors.js";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getSignedInUser } from "./_lib/creditGate.js";
import { requireAdmin } from "./_lib/adminAuth.js";

// Single action-dispatch endpoint (not one file per route), same pattern as
// admin.js/support.js — api/ is already at Vercel Hobby's 12-Serverless-
// Function cap (see CLAUDE.md), so this spans admin-gated ambassador
// management and the public-ish (signed-in-only) apply-referral action in
// one file instead of splitting by audience.

function generateReferralCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "A1B2C3D4"
}

async function handleCreate(supabaseAdmin, body, res) {
  const { email, customCode } = body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Missing email." });
    return;
  }

  // Existing users only in this phase — no invite-by-email flow yet.
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email.trim())
    .maybeSingle();
  if (profileErr) throw profileErr;
  if (!profile) {
    res.status(404).json({ error: "No signed-up user found with that email." });
    return;
  }

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("ambassadors")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();
  if (existingErr) throw existingErr;
  if (existing) {
    res.status(400).json({ error: "This user is already an ambassador." });
    return;
  }

  let referralCode;
  if (customCode && String(customCode).trim()) {
    referralCode = String(customCode).trim().replace(/[^A-Za-z0-9-]/g, "").toUpperCase().slice(0, 30);
    if (!referralCode) {
      res.status(400).json({ error: "Custom code must contain at least one letter or number." });
      return;
    }
    const { data: taken, error: takenErr } = await supabaseAdmin
      .from("ambassadors")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (takenErr) throw takenErr;
    if (taken) {
      res.status(409).json({ error: "This referral code is already taken." });
      return;
    }
  } else {
    referralCode = generateReferralCode();
  }

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("ambassadors")
    .insert({ user_id: profile.id, referral_code: referralCode })
    .select("id, referral_code")
    .single();
  if (insertErr) throw insertErr;

  res.status(200).json({ id: inserted.id, referralCode: inserted.referral_code });
}

async function handleList(supabaseAdmin, res) {
  const { data: ambassadors, error } = await supabaseAdmin
    .from("ambassadors")
    .select("id, user_id, referral_code, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const userIds = (ambassadors || []).map((a) => a.user_id);
  const emailById = {};
  if (userIds.length > 0) {
    const { data: profiles, error: profilesErr } = await supabaseAdmin.from("profiles").select("id, email").in("id", userIds);
    if (profilesErr) throw profilesErr;
    for (const p of profiles || []) emailById[p.id] = p.email;
  }

  // Bounded by however many ambassadors exist (a small, admin-managed list),
  // same "fetch then tally per row in parallel" approach admin.js's
  // list-users already uses for its own per-row lookups.
  const results = await Promise.all(
    (ambassadors || []).map(async (a) => {
      const [referralResult, conversionResult] = await Promise.all([
        supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by_ambassador_id", a.id),
        supabaseAdmin
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("referred_by_ambassador_id", a.id)
          .eq("status", "active"),
      ]);
      if (referralResult.error) throw referralResult.error;
      if (conversionResult.error) throw conversionResult.error;
      return {
        id: a.id,
        email: emailById[a.user_id] || a.user_id,
        referralCode: a.referral_code,
        status: a.status,
        createdAt: a.created_at,
        referralCount: referralResult.count || 0,
        conversionCount: conversionResult.count || 0,
      };
    })
  );

  res.status(200).json({ ambassadors: results });
}

async function handleSetStatus(supabaseAdmin, body, res) {
  const { ambassadorId, status } = body;
  if (!ambassadorId || (status !== "active" && status !== "disabled")) {
    res.status(400).json({ error: "Missing ambassadorId or invalid status." });
    return;
  }

  const { error } = await supabaseAdmin.from("ambassadors").update({ status }).eq("id", ambassadorId);
  if (error) throw error;

  res.status(200).json({ ok: true });
}

// Best-effort attribution — never surfaces an error for an unknown/disabled
// code, a self-referral attempt, or a user who's already attributed (first
// referral wins, for the life of the account). A brand-new signed-in user
// should never see this fail.
async function handleApplyReferral(supabaseAdmin, user, body, res) {
  const { referralCode } = body;
  if (!referralCode || typeof referralCode !== "string") {
    res.status(200).json({ ok: true });
    return;
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("referred_by_ambassador_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profileErr) throw profileErr;
  if (profile?.referred_by_ambassador_id) {
    res.status(200).json({ ok: true });
    return;
  }

  const { data: ambassador, error: ambassadorErr } = await supabaseAdmin
    .from("ambassadors")
    .select("id, user_id, status")
    .eq("referral_code", referralCode.trim().toUpperCase())
    .maybeSingle();
  if (ambassadorErr) throw ambassadorErr;
  if (!ambassador || ambassador.status !== "active" || ambassador.user_id === user.id) {
    res.status(200).json({ ok: true });
    return;
  }

  const { error: updateErr } = await supabaseAdmin
    .from("profiles")
    .update({ referred_by_ambassador_id: ambassador.id })
    .eq("id", user.id);
  if (updateErr) throw updateErr;

  res.status(200).json({ ok: true });
}

const ADMIN_ACTIONS = new Set(["create", "list", "set-status"]);

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

  if (ADMIN_ACTIONS.has(action)) {
    const admin = await requireAdmin(req, res, supabaseAdmin);
    if (!admin) return;
  }

  try {
    switch (action) {
      case "create":
        await handleCreate(supabaseAdmin, body, res);
        return;
      case "list":
        await handleList(supabaseAdmin, res);
        return;
      case "set-status":
        await handleSetStatus(supabaseAdmin, body, res);
        return;
      case "apply-referral": {
        const user = await getSignedInUser(req, supabaseAdmin);
        if (!user) {
          res.status(401).json({ error: "Please sign in." });
          return;
        }
        await handleApplyReferral(supabaseAdmin, user, body, res);
        return;
      }
      default:
        res.status(400).json({ error: "Unknown action." });
        return;
    }
  } catch (err) {
    console.error(`ambassadors handler error (action=${action}):`, err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
}

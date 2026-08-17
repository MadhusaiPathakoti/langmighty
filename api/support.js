import crypto from "node:crypto";
import { applyCors } from "./_lib/cors.js";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getSignedInUser, getClientIp } from "./_lib/creditGate.js";
import { getRedis } from "./_lib/redisCache.js";
import { requireAdmin } from "./_lib/adminAuth.js";
import { sendAdminNotificationEmail } from "./_lib/resend.js";

// Single action-dispatch endpoint (not one file per route) rather than the
// api/support/ folder this started as — Vercel's Hobby plan caps a
// deployment at 12 Serverless Functions, and adding 3 new files here (on top
// of the existing 11) pushed a build over that limit. Same pattern as
// api/pdf-store/admin.js, just spanning public actions (create-upload-url,
// submit) and admin-gated ones (list, update-status) in one file instead of
// splitting by audience.
const ATTACHMENTS_BUCKET = "support-attachments";
const SIGNED_URL_TTL_SECONDS = 300;

const SUBJECT_MAX_LEN = 200;
const MESSAGE_MAX_LEN = 5000;
const MAX_ATTACHMENTS = 3;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Coarse per-IP anti-spam cap — submit is unauthenticated by design (anyone
// should be able to report a problem, including "I can't sign in"), so it
// needs its own limit rather than borrowing the translate/chat credit gate,
// which is about a different kind of usage entirely.
const IP_DAILY_LIMIT = 5;

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function checkIpRateLimit(ip) {
  const redis = getRedis();
  if (!redis) return true; // fail open, matching the credit gate's convention

  const key = `support-ticket-ip:${ip}:${new Date().toISOString().slice(0, 10)}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60 * 60 * 24);
  }
  return count <= IP_DAILY_LIMIT;
}

// Public — anyone (signed in or not) should be able to attach a screenshot to
// a report. The client uploads the file bytes directly to Supabase Storage
// via this signed URL, so they never pass through this function's request
// body (avoiding Vercel's body-size limits for a multi-MB screenshot).
async function handleCreateUploadUrl(supabaseAdmin, body, res) {
  const { fileName } = body;
  if (!fileName || typeof fileName !== "string") {
    res.status(400).json({ error: "Missing fileName." });
    return;
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await supabaseAdmin.storage.from(ATTACHMENTS_BUCKET).createSignedUploadUrl(path);
  if (error) throw error;

  res.status(200).json({ path, token: data.token, signedUrl: data.signedUrl });
}

// Public — see handleCreateUploadUrl for why sign-in isn't required.
async function handleSubmit(req, res, supabaseAdmin, body) {
  const { subject, message, email, attachments } = body;
  const trimmedSubject = typeof subject === "string" ? subject.trim() : "";
  const trimmedMessage = typeof message === "string" ? message.trim() : "";
  const trimmedEmail = typeof email === "string" ? email.trim() : "";

  if (!trimmedSubject || !trimmedMessage) {
    res.status(400).json({ error: "Please fill in both the subject and the message." });
    return;
  }
  if (trimmedSubject.length > SUBJECT_MAX_LEN) {
    res.status(400).json({ error: `Subject must be under ${SUBJECT_MAX_LEN} characters.` });
    return;
  }
  if (trimmedMessage.length > MESSAGE_MAX_LEN) {
    res.status(400).json({ error: `Message must be under ${MESSAGE_MAX_LEN} characters.` });
    return;
  }
  if (!EMAIL_RE.test(trimmedEmail)) {
    res.status(400).json({ error: "Please provide a valid email so we can reply." });
    return;
  }

  const safeAttachments = Array.isArray(attachments) ? attachments.slice(0, MAX_ATTACHMENTS) : [];
  for (const a of safeAttachments) {
    if (!a || typeof a.path !== "string" || typeof a.name !== "string") {
      res.status(400).json({ error: "Invalid attachment data." });
      return;
    }
  }

  const ip = getClientIp(req);
  if (!(await checkIpRateLimit(ip))) {
    res.status(429).json({ error: "You've submitted several reports today — please try again tomorrow." });
    return;
  }

  const user = await getSignedInUser(req, supabaseAdmin);

  const { data: ticket, error: insertErr } = await supabaseAdmin
    .from("support_tickets")
    .insert({
      user_id: user?.id ?? null,
      reporter_email: trimmedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
      attachments: safeAttachments,
    })
    .select("id")
    .single();
  if (insertErr) throw insertErr;

  try {
    const attachmentNote =
      safeAttachments.length > 0
        ? `<p>${safeAttachments.length} attachment(s): ${safeAttachments.map((a) => escapeHtml(a.name)).join(", ")} — view them in the LangMighty admin panel.</p>`
        : "";
    await sendAdminNotificationEmail({
      subject: `New support ticket: ${trimmedSubject}`,
      html: `
        <p><strong>From:</strong> ${escapeHtml(trimmedEmail)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(trimmedSubject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(trimmedMessage).replace(/\n/g, "<br>")}</p>
        ${attachmentNote}
      `,
    });
  } catch (emailErr) {
    // The ticket is already saved and visible in the admin inbox regardless of
    // whether the notification email goes out — don't fail the request over a
    // Resend hiccup.
    console.error("Support ticket notification email failed:", emailErr);
  }

  res.status(200).json({ ok: true, ticketId: ticket.id });
}

// Admin-gated — checked by requireAdmin() before this ever runs.
async function handleList(supabaseAdmin, res) {
  const { data, error } = await supabaseAdmin
    .from("support_tickets")
    .select("id, reporter_email, subject, message, attachments, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const tickets = await Promise.all(
    (data || []).map(async (ticket) => {
      const attachments = Array.isArray(ticket.attachments) ? ticket.attachments : [];
      const signedAttachments = await Promise.all(
        attachments.map(async (a) => {
          const { data: signed, error: signErr } = await supabaseAdmin.storage
            .from(ATTACHMENTS_BUCKET)
            .createSignedUrl(a.path, SIGNED_URL_TTL_SECONDS, { download: a.name });
          if (signErr) {
            console.error("support list: could not sign attachment url:", signErr);
            return { name: a.name, url: null };
          }
          return { name: a.name, url: signed.signedUrl };
        })
      );

      return {
        id: ticket.id,
        reporterEmail: ticket.reporter_email,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        createdAt: ticket.created_at,
        attachments: signedAttachments,
      };
    })
  );

  res.status(200).json({ tickets });
}

// Admin-gated — checked by requireAdmin() before this ever runs.
async function handleUpdateStatus(supabaseAdmin, body, res) {
  const { ticketId, status } = body;
  if (!ticketId || !["open", "resolved"].includes(status)) {
    res.status(400).json({ error: "Missing ticketId or invalid status." });
    return;
  }

  const { error } = await supabaseAdmin
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (error) throw error;

  res.status(200).json({ ok: true });
}

const ADMIN_ACTIONS = new Set(["list", "update-status"]);

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
      case "create-upload-url":
        await handleCreateUploadUrl(supabaseAdmin, body, res);
        return;
      case "submit":
        await handleSubmit(req, res, supabaseAdmin, body);
        return;
      case "list":
        await handleList(supabaseAdmin, res);
        return;
      case "update-status":
        await handleUpdateStatus(supabaseAdmin, body, res);
        return;
      default:
        res.status(400).json({ error: "Unknown action." });
        return;
    }
  } catch (err) {
    console.error(`support handler error (action=${action}):`, err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
}

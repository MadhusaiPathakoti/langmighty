import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { getSignedInUser, getClientIp } from "../_lib/creditGate.js";
import { getRedis } from "../_lib/redisCache.js";
import { sendAdminNotificationEmail } from "../_lib/resend.js";

const SUBJECT_MAX_LEN = 200;
const MESSAGE_MAX_LEN = 5000;
const MAX_ATTACHMENTS = 3;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Coarse per-IP anti-spam cap — this endpoint is unauthenticated by design
// (anyone should be able to report a problem, including "I can't sign in"),
// so it needs its own limit rather than borrowing the translate/chat credit
// gate, which is about a different kind of usage entirely.
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

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { subject, message, email, attachments } = req.body || {};
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

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Server is missing Supabase configuration." });
    return;
  }

  const ip = getClientIp(req);
  if (!(await checkIpRateLimit(ip))) {
    res.status(429).json({ error: "You've submitted several reports today — please try again tomorrow." });
    return;
  }

  try {
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
      // The ticket is already saved and visible in the admin inbox regardless
      // of whether the notification email goes out — don't fail the request
      // over a Resend hiccup.
      console.error("Support ticket notification email failed:", emailErr);
    }

    res.status(200).json({ ok: true, ticketId: ticket.id });
  } catch (err) {
    console.error("support submit handler error:", err);
    res.status(500).json({ error: "Could not submit your report. Please try again." });
  }
}

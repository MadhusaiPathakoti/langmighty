import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { requireAdmin } from "../_lib/adminAuth.js";

const ATTACHMENTS_BUCKET = "support-attachments";
const SIGNED_URL_TTL_SECONDS = 300;

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
            console.error("support admin list: could not sign attachment url:", signErr);
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
    console.error(`support admin handler error (action=${action}):`, err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
}

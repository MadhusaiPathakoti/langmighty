import crypto from "node:crypto";
import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { requireAdmin } from "../_lib/adminAuth.js";

const ORIGINALS_BUCKET = "pdf-store-originals";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { fileName } = req.body || {};
  if (!fileName || typeof fileName !== "string") {
    res.status(400).json({ error: "Missing fileName." });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const admin = await requireAdmin(req, res, supabaseAdmin);
  if (!admin) return;

  try {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${crypto.randomUUID()}-${safeName}`;

    const { data, error } = await supabaseAdmin.storage.from(ORIGINALS_BUCKET).createSignedUploadUrl(path);
    if (error) throw error;

    res.status(200).json({ path, token: data.token, signedUrl: data.signedUrl });
  } catch (err) {
    console.error("admin-create-upload-url handler error:", err);
    res.status(500).json({ error: "Could not prepare the upload." });
  }
}

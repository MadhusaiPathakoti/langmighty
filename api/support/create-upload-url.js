import crypto from "node:crypto";
import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

const ATTACHMENTS_BUCKET = "support-attachments";

// Public on purpose — anyone (signed in or not) should be able to report a
// problem. Mirrors api/pdf-store/admin.js's `create-upload-url` action: the
// client uploads the file bytes directly to Supabase Storage via the signed
// URL, so they never pass through this serverless function's request body
// (avoiding Vercel's body-size limits for what could be a multi-MB screenshot).
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
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Server is missing Supabase configuration." });
    return;
  }

  try {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${crypto.randomUUID()}-${safeName}`;

    const { data, error } = await supabaseAdmin.storage.from(ATTACHMENTS_BUCKET).createSignedUploadUrl(path);
    if (error) throw error;

    res.status(200).json({ path, token: data.token, signedUrl: data.signedUrl });
  } catch (err) {
    console.error("support create-upload-url handler error:", err);
    res.status(500).json({ error: "Could not prepare the file upload." });
  }
}

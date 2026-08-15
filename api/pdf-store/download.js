import { applyCors } from "../_lib/cors.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { getSignedInUser } from "../_lib/creditGate.js";
import { decryptPassword } from "../_lib/pdfPassword.js";

const LOCKED_BUCKET = "pdf-store-locked";
const SIGNED_URL_TTL_SECONDS = 120;

function toFilename(title) {
  const safe = title.replace(/[\\/:*?"<>|]/g, "").trim().replace(/\s+/g, " ");
  return `${safe || "download"}.pdf`;
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { pdfId, password } = req.body || {};
  if (!pdfId || !password) {
    res.status(400).json({ error: "Missing pdfId or password." });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Server is missing Supabase configuration." });
    return;
  }

  const user = await getSignedInUser(req, supabaseAdmin);
  if (!user) {
    res.status(401).json({ error: "Please sign in." });
    return;
  }

  try {
    const { data: purchase, error } = await supabaseAdmin
      .from("pdf_store_purchases")
      .select("password_ciphertext, password_iv, password_tag, locked_storage_path, pdf_store_items(title)")
      .eq("user_id", user.id)
      .eq("pdf_id", pdfId)
      .eq("status", "paid")
      .maybeSingle();
    if (error) throw error;
    if (!purchase || !purchase.locked_storage_path) {
      res.status(403).json({ error: "You haven't purchased this PDF yet." });
      return;
    }

    const actualPassword = decryptPassword({
      ciphertext: purchase.password_ciphertext,
      iv: purchase.password_iv,
      tag: purchase.password_tag,
    });
    if (password !== actualPassword) {
      res.status(401).json({ error: "Incorrect password." });
      return;
    }

    const filename = toFilename(purchase.pdf_store_items?.title || "download");
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from(LOCKED_BUCKET)
      .createSignedUrl(purchase.locked_storage_path, SIGNED_URL_TTL_SECONDS, { download: filename });
    if (signErr) throw signErr;

    res.status(200).json({ url: signed.signedUrl });
  } catch (err) {
    console.error("download handler error:", err);
    res.status(500).json({ error: "Could not prepare the download. Please try again." });
  }
}

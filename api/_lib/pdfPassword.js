import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
// Unambiguous characters only (no 0/O, 1/I/l) since this is read by a human off a screen.
const PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Random, permanent, human-typeable — this is shown to the buyer once, viewable
// again later via "View Password", and never regenerated or changed.
export function generatePassword(length = 10) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length];
  }
  return out;
}

function getKey() {
  const b64 = process.env.PDF_STORE_PASSWORD_ENC_KEY;
  if (!b64) return null;
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("PDF_STORE_PASSWORD_ENC_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

// Stored encrypted at rest rather than in cleartext — this column doubles as
// the real PDF-open password, so it's worth the AES-GCM round trip even though
// the table itself has no RLS policies exposing it to any client key.
export function encryptPassword(plaintext) {
  const key = getKey();
  if (!key) throw new Error("PDF_STORE_PASSWORD_ENC_KEY is not configured.");

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptPassword({ ciphertext, iv, tag }) {
  const key = getKey();
  if (!key) throw new Error("PDF_STORE_PASSWORD_ENC_KEY is not configured.");

  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf-8");
}

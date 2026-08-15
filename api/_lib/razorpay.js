import Razorpay from "razorpay";

let cached = null;
let cachedKey = null;

// Lazy singleton, re-read env vars per call — same pattern as getSupabaseAdmin/getRedis.
export function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;

  const cacheKey = `${keyId}:${keySecret}`;
  if (cached && cachedKey === cacheKey) return cached;

  cached = new Razorpay({ key_id: keyId, key_secret: keySecret });
  cachedKey = cacheKey;
  return cached;
}

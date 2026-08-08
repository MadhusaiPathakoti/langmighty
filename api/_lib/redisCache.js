import { Redis } from "@upstash/redis";

let cachedClient = null;
let cachedKey = null;

// Same lazy-init pattern as supabaseAdmin.js — read env vars fresh on every call
// instead of once at module-import time, so adding the keys to .env after the dev
// server started doesn't leave this stuck thinking Redis is unconfigured.
export function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const cacheKey = `${url}:${token}`;
  if (cachedClient && cachedKey === cacheKey) return cachedClient;

  cachedClient = new Redis({ url, token });
  cachedKey = cacheKey;
  return cachedClient;
}

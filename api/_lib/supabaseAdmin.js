import { createClient } from "@supabase/supabase-js";

let cachedClient = null;
let cachedKey = null;

// Reads process.env on every call rather than once at module-import time. In local
// dev, Vite's ssrLoadModule caches this module across requests, so a client built
// from a one-time snapshot would stay stuck as "unconfigured" forever if the env
// vars were added to .env after the module first loaded.
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  const cacheKey = `${supabaseUrl}:${serviceRoleKey}`;
  if (cachedClient && cachedKey === cacheKey) return cachedClient;

  cachedClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  cachedKey = cacheKey;
  return cachedClient;
}

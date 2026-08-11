// Base URL for API calls. Empty string keeps today's relative-path behavior
// for the web build (same-origin `/api/...`); a native (Capacitor) build sets
// VITE_API_BASE_URL to the deployed API's origin, since a native app has no
// same-origin API to call.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const ANON_ID_KEY = "langlearn_anon_id";

// Persists a random id for the free-credit gate (api/_lib/creditGate.js) to key
// anonymous usage on. Sent as a header rather than relying on a cookie the
// server sets, since a native app's WebView doesn't reliably attach a cookie
// set by a cross-origin API the way a browser tab does.
function getOrCreateAnonId() {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...options.headers, "X-Anon-Id": getOrCreateAnonId() },
  });
}

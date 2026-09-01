// The web app calls these routes same-origin, but the native (Capacitor) app's
// WebView runs at its own origin (https://localhost on Android,
// capacitor://localhost on iOS) — never the same origin as this API — so every
// request from it is cross-origin and gets blocked by the browser without
// these headers. Wildcard is safe here: auth uses a Bearer token the client
// explicitly attaches itself, not cookies, so there's no ambient credential a
// wildcard origin could leak.
//
// Returns true if the request was a CORS preflight (already fully handled —
// the caller should return immediately) or false if the caller should proceed.
export function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Anon-Id");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

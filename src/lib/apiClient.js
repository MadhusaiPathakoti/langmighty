const ANON_ID_KEY = "langlearn_anon_id";

// Persists a random id for the free-credit gate (api/_lib/creditGate.js) to key
// anonymous usage on, sent as a header rather than a server-set cookie.
function getOrCreateAnonId() {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export function apiFetch(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: { ...options.headers, "X-Anon-Id": getOrCreateAnonId() },
  });
}

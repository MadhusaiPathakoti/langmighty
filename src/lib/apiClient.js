export function apiFetch(path, options = {}) {
  return fetch(path, options);
}

// Shared by every call site that hits a usage-limited endpoint (translate,
// chat, game-content's play check — see api/_lib/usageLimits.js) so the same
// 5-line 429 check isn't repeated at each one. Mirrors the existing
// `res.status === 401` / reportAuthRequired() convention those call sites
// already use for the sign-in gate.
export function isLimitReached(res) {
  return res.status === 429;
}

export async function reportLimitFromResponse(res, reportLimitReached) {
  const data = await res.json().catch(() => ({}));
  reportLimitReached(data.feature, data.limit, data.tier);
}

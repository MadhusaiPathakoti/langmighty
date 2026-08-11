import { apiFetch } from "./lib/apiClient.js";

// Bulk-generated (via scripts/seedGameContent.mjs) and cached in Redis — fetched
// once per session and merged with the static QUIZ_PHRASES bank (langmighty-shared).
// Falls back to an empty list (so callers just get the static bank) if
// unconfigured, not yet seeded, or the request fails.
let extraPhrasesPromise = null;
export function loadExtraPhrases() {
  if (!extraPhrasesPromise) {
    extraPhrasesPromise = apiFetch("/api/game-content?type=phrases")
      .then((res) => (res.ok ? res.json() : { phrases: [] }))
      .then((data) => (Array.isArray(data.phrases) ? data.phrases : []))
      .catch(() => []);
  }
  return extraPhrasesPromise;
}

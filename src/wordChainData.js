import { apiFetch } from "./lib/apiClient.js";

// Bulk-generated (via scripts/seedGameContent.mjs) and cached in Redis — fetched
// once per session and merged with the static WORD_CHAIN_SENTENCES bank (langmighty-shared).
// Falls back to an empty list (so callers just get the static bank) if
// unconfigured, not yet seeded, or the request fails.
let extraSentencesPromise = null;
export function loadExtraSentences() {
  if (!extraSentencesPromise) {
    extraSentencesPromise = apiFetch("/api/game-content?type=sentences")
      .then((res) => (res.ok ? res.json() : { sentences: [] }))
      .then((data) => (Array.isArray(data.sentences) ? data.sentences : []))
      .catch(() => []);
  }
  return extraSentencesPromise;
}

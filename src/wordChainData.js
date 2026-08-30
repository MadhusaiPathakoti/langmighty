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

// Word Chain's own difficulty tiers, distinct from Read Aloud's
// (readAloudData.js's bucketByDifficulty) — each game picks the word-count
// ranges that make sense for how it's played. Word count is per-language
// (see the comment on WORD_CHAIN_SENTENCES), so a sentence can land in
// different buckets depending on the target language, and — since the
// ranges deliberately overlap at the edges (e.g. a 3-word sentence is both
// "easy" and "medium") — in more than one bucket for the same language.
export const WORD_CHAIN_DIFFICULTIES = [
  { key: "easy", label: "Easy (1-3 words)", min: 1, max: 3 },
  { key: "medium", label: "Medium (2-5 words)", min: 2, max: 5 },
  { key: "hard", label: "Hard (5-7 words)", min: 5, max: 7 },
];

export function bucketWordChainByDifficulty(sentences, langKey) {
  const buckets = { easy: [], medium: [], hard: [] };
  for (const sentence of sentences) {
    const words = sentence.translations?.[langKey];
    if (!Array.isArray(words) || words.length === 0) continue;

    for (const { key, min, max } of WORD_CHAIN_DIFFICULTIES) {
      if (words.length >= min && words.length <= max) buckets[key].push(sentence);
    }
  }
  return buckets;
}

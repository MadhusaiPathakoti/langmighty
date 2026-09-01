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

// Listen & Guess's own difficulty tiers, same word-count-bucketing idea as
// Word Chain (wordChainData.js) but applied to QUIZ_PHRASES, whose entries are
// single words or very short (1-3 word) phrases rather than full sentences.
// Bucketed on the target language's own translation (word count differs per
// language, same reasoning as WORD_CHAIN_DIFFICULTIES) — except when the game
// is set to "mixed" languages, where there's no single language to bucket by,
// so the (language-agnostic) English word count is used instead.
export const LISTEN_DIFFICULTIES = [
  { key: "easy", label: "Easy (1 word)" },
  { key: "medium", label: "Medium (2 words)" },
  { key: "hard", label: "Hard (3+ words)" },
];

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function bucketPhrasesByDifficulty(phrases, langKey) {
  const buckets = { easy: [], medium: [], hard: [] };
  for (const phrase of phrases) {
    const text = langKey === "mixed" ? phrase.english : phrase.translations?.[langKey];
    if (!text) continue;

    const count = wordCount(text);
    if (count <= 1) buckets.easy.push(phrase);
    else if (count === 2) buckets.medium.push(phrase);
    else buckets.hard.push(phrase);
  }
  return buckets;
}

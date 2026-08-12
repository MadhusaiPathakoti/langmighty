import { apiFetch } from "./lib/apiClient.js";

// SpeechRecognition needs a BCP-47 locale, not just the language key used
// elsewhere in the app.
export const LANGUAGE_TO_SPEECH_LOCALE = {
  telugu: "te-IN",
  hindi: "hi-IN",
  kannada: "kn-IN",
  malayalam: "ml-IN",
  tamil: "ta-IN",
};

// Bulk-generated (via scripts/seedGameContent.mjs) and cached in Redis — same
// pattern as loadExtraSentences in wordChainData.js, just a different Redis
// key/word-count range. Falls back to an empty list if unconfigured, not yet
// seeded, or the request fails.
let extraShortPromise = null;
export function loadExtraShortSentences() {
  if (!extraShortPromise) {
    extraShortPromise = apiFetch("/api/game-content?type=short-sentences")
      .then((res) => (res.ok ? res.json() : { sentences: [] }))
      .then((data) => (Array.isArray(data.sentences) ? data.sentences : []))
      .catch(() => []);
  }
  return extraShortPromise;
}

let extraLongPromise = null;
export function loadExtraLongSentences() {
  if (!extraLongPromise) {
    extraLongPromise = apiFetch("/api/game-content?type=long-sentences")
      .then((res) => (res.ok ? res.json() : { sentences: [] }))
      .then((data) => (Array.isArray(data.sentences) ? data.sentences : []))
      .catch(() => []);
  }
  return extraLongPromise;
}

// Word count differs per language for the same sentence (see the comment on
// WORD_CHAIN_SENTENCES), so difficulty is bucketed per-language, not globally.
export function bucketByDifficulty(sentences, langKey) {
  const buckets = { easy: [], medium: [], hard: [] };
  for (const sentence of sentences) {
    const words = sentence.translations?.[langKey];
    if (!Array.isArray(words) || words.length === 0) continue;

    const count = words.length;
    if (count <= 2) buckets.easy.push(sentence);
    else if (count <= 5) buckets.medium.push(sentence);
    else if (count <= 10) buckets.hard.push(sentence);
  }
  return buckets;
}

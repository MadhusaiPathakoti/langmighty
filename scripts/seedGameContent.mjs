// One-time bulk content generator for the Playground games. Run manually via
// `node scripts/seedGameContent.mjs` — this is NOT a public API route, so there's
// no runtime abuse surface; it calls Gemini a fixed number of times and writes
// the validated results permanently into Redis (no TTL) under the keys that
// api/game-content.js serves to the app.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Redis } from "@upstash/redis";
import { LANGUAGES, QUIZ_CATEGORIES, QUIZ_PHRASES, WORD_CHAIN_SENTENCES } from "langmighty-shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANG_KEYS = LANGUAGES.map((l) => l.key); // ["telugu","hindi","kannada","malayalam","tamil"]
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const PHRASES_PER_CATEGORY = 12;
const SENTENCE_BATCHES = [15, 15];

function readDotEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  const result = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    result[trimmed.slice(0, idx).trim()] = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
  return result;
}

const env = readDotEnv();
if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing from .env");
if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing from .env");
}

const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });

async function callGemini(prompt, schema) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.7 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini API error: ${await response.text()}`);
  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty Gemini response");
  return JSON.parse(raw);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueId(base, taken) {
  let id = base || "item";
  let n = 2;
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n++;
  }
  taken.add(id);
  return id;
}

function scriptFor(langKey) {
  return LANGUAGES.find((l) => l.key === langKey).script;
}

// `script.test(text)` alone only checks the string CONTAINS at least one
// character of that script — it happily passes a string that's mostly the
// wrong script with just one stray matching character. This checks the string
// contains ONLY the target script (plus punctuation/spaces/etc.), rejecting any
// contamination from one of the other four scripts — including single
// near-identical-looking characters from the wrong Unicode block (e.g. a Tamil
// vowel sign that visually resembles the correct Telugu one).
function isPureScript(text, langKey) {
  if (!scriptFor(langKey).test(text)) return false;
  for (const other of LANG_KEYS) {
    if (other === langKey) continue;
    if (scriptFor(other).test(text)) return false;
  }
  return true;
}

// Pronunciation fields should be romanized (Latin letters) — reject anything
// that's actually still in one of the five native scripts (a sign Gemini just
// echoed the word back instead of transliterating it).
function isRomanized(text) {
  return !LANG_KEYS.some((k) => scriptFor(k).test(text));
}

// ---------- Phrases ----------

function phraseSchema() {
  return {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        english: { type: "STRING" },
        ...Object.fromEntries(LANG_KEYS.map((k) => [k, { type: "STRING" }])),
      },
      required: ["english", ...LANG_KEYS],
    },
  };
}

async function generatePhrasesForCategory(category, existingEnglish) {
  const prompt = `You are generating vocabulary for a language-learning quiz app that teaches English speakers Kannada, Hindi, Malayalam, Tamil, and Telugu.

Generate ${PHRASES_PER_CATEGORY} NEW common, everyday English words or very short phrases (1-3 words) in the category "${category.label}", each with an accurate, natural, commonly-used translation into Kannada, Hindi, Malayalam, Tamil, and Telugu, written in each language's own native script (never romanized).

Do not reuse any of these English words/phrases, which already exist in the app:
${existingEnglish.join(", ")}

Respond only with a JSON array matching the schema — no extra commentary.`;

  const raw = await callGemini(prompt, phraseSchema());
  if (!Array.isArray(raw)) return [];

  const validated = [];
  const takenIds = new Set(QUIZ_PHRASES.map((p) => p.id));
  const existingLower = new Set(existingEnglish.map((e) => e.toLowerCase()));

  for (const item of raw) {
    if (!item?.english || typeof item.english !== "string") continue;
    if (existingLower.has(item.english.trim().toLowerCase())) continue;

    const translations = {};
    let allValid = true;
    for (const lang of LANG_KEYS) {
      const text = item[lang];
      if (typeof text !== "string" || !text.trim() || !isPureScript(text.trim(), lang)) {
        allValid = false;
        break;
      }
      translations[lang] = text.trim();
    }
    if (!allValid) continue;

    existingLower.add(item.english.trim().toLowerCase());
    validated.push({
      id: uniqueId(slugify(item.english), takenIds),
      category: category.key,
      english: item.english.trim(),
      translations,
    });
  }
  return validated;
}

// ---------- Sentences ----------

const PRON_KEYS = LANG_KEYS.map((k) => `${k}Pron`);

function sentenceSchema() {
  return {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        english: { type: "STRING" },
        ...Object.fromEntries(LANG_KEYS.map((k) => [k, { type: "ARRAY", items: { type: "STRING" } }])),
        ...Object.fromEntries(PRON_KEYS.map((k) => [k, { type: "ARRAY", items: { type: "STRING" } }])),
      },
      required: ["english", ...LANG_KEYS, ...PRON_KEYS],
    },
  };
}

function fewShotExamples() {
  return WORD_CHAIN_SENTENCES.slice(0, 2).map((s) => ({
    english: s.english,
    ...Object.fromEntries(LANG_KEYS.map((k) => [k, s.translations[k]])),
    ...Object.fromEntries(LANG_KEYS.map((k) => [`${k}Pron`, s.pronunciation[k]])),
  }));
}

async function generateSentenceBatch(count, existingEnglish) {
  const prompt = `You are generating short, common English sentences for language-learning games. Each sentence is split into an ordered array of words per language, for the learner to tap in the correct order, alongside a parallel array of romanized (Latin-letter) pronunciation for each of those same words, in the same order.

Generate ${count} NEW simple, common everyday English sentences (3-8 words), each translated and segmented into words for Kannada, Hindi, Malayalam, Tamil, and Telugu, written in each language's own native script (never romanized) for the "<language>" fields, with a matching "<language>Pron" array giving the romanized pronunciation of each of those exact words in the same order — one pronunciation entry per word, same array length.

Each language's word array must be that language's OWN natural word-by-word breakdown — not a forced word-for-word gloss of the English. Word counts should differ across languages when that's genuinely how each language expresses the idea (e.g. Malayalam or Tamil often combine what English needs 4 words for into 2).

Here is the exact format expected, with two real examples:
${JSON.stringify(fewShotExamples(), null, 2)}

Do not reuse any of these English sentences, which already exist in the app:
${existingEnglish.join(" | ")}

Respond only with a JSON array matching the schema — no extra commentary.`;

  const raw = await callGemini(prompt, sentenceSchema());
  if (!Array.isArray(raw)) return [];

  const validated = [];
  const takenIds = new Set(WORD_CHAIN_SENTENCES.map((s) => s.id));
  const existingLower = new Set(existingEnglish.map((e) => e.toLowerCase()));

  for (const item of raw) {
    if (!item?.english || typeof item.english !== "string") continue;
    if (existingLower.has(item.english.trim().toLowerCase())) continue;

    const translations = {};
    const pronunciation = {};
    let allValid = true;
    for (const lang of LANG_KEYS) {
      const words = item[lang];
      const pron = item[`${lang}Pron`];
      if (!Array.isArray(words) || words.length === 0) {
        allValid = false;
        break;
      }
      const cleanWords = words.map((w) => String(w).trim()).filter(Boolean);
      if (cleanWords.length === 0 || !cleanWords.every((w) => isPureScript(w, lang))) {
        allValid = false;
        break;
      }
      if (!Array.isArray(pron) || pron.length !== cleanWords.length) {
        allValid = false;
        break;
      }
      const cleanPron = pron.map((w) => String(w).trim()).filter(Boolean);
      if (cleanPron.length !== cleanWords.length || !cleanPron.every(isRomanized)) {
        allValid = false;
        break;
      }
      translations[lang] = cleanWords;
      pronunciation[lang] = cleanPron;
    }
    if (!allValid) continue;

    existingLower.add(item.english.trim().toLowerCase());
    validated.push({
      id: uniqueId(slugify(item.english), takenIds),
      english: item.english.trim(),
      translations,
      pronunciation,
    });
  }
  return validated;
}

// ---------- Main ----------

async function main() {
  console.log(`Generating phrases for ${QUIZ_CATEGORIES.length} categories...`);
  const existingEnglish = QUIZ_PHRASES.map((p) => p.english);
  let allNewPhrases = [];
  for (const category of QUIZ_CATEGORIES) {
    try {
      const generated = await generatePhrasesForCategory(category, [...existingEnglish, ...allNewPhrases.map((p) => p.english)]);
      console.log(`  ${category.key}: +${generated.length} phrases`);
      allNewPhrases = allNewPhrases.concat(generated);
    } catch (err) {
      console.error(`  ${category.key}: FAILED — ${err.message}`);
    }
  }

  console.log(`\nGenerating sentences in ${SENTENCE_BATCHES.length} batches...`);
  const existingSentenceEnglish = WORD_CHAIN_SENTENCES.map((s) => s.english);
  let allNewSentences = [];
  for (const count of SENTENCE_BATCHES) {
    try {
      const generated = await generateSentenceBatch(count, [
        ...existingSentenceEnglish,
        ...allNewSentences.map((s) => s.english),
      ]);
      console.log(`  batch of ${count}: +${generated.length} sentences`);
      allNewSentences = allNewSentences.concat(generated);
    } catch (err) {
      console.error(`  batch of ${count}: FAILED — ${err.message}`);
    }
  }

  console.log(`\nTotal validated: ${allNewPhrases.length} phrases, ${allNewSentences.length} sentences`);

  if (allNewPhrases.length > 0) {
    await redis.set("game-content:phrases", allNewPhrases);
    console.log("Wrote game-content:phrases to Redis.");
  }
  if (allNewSentences.length > 0) {
    await redis.set("game-content:sentences", allNewSentences);
    console.log("Wrote game-content:sentences to Redis.");
  }
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});

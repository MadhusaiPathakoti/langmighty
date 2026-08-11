// One-time patch: the AI-generated sentences already cached in Redis (from the
// first seedGameContent.mjs run) predate the pronunciation field added to that
// script afterward. This adds pronunciation to those existing sentences without
// touching their translations — giving Gemini the exact words already stored and
// asking only for a parallel romanization, so there's no risk of it silently
// changing the (already-validated) translation text.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Redis } from "@upstash/redis";
import { LANGUAGES } from "langmighty-shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANG_KEYS = LANGUAGES.map((l) => l.key);
const GEMINI_MODEL = "gemini-3.5-flash-lite";

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
const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });

function scriptFor(langKey) {
  return LANGUAGES.find((l) => l.key === langKey).script;
}
function isRomanized(text) {
  return !LANG_KEYS.some((k) => scriptFor(k).test(text));
}

async function callGemini(prompt, schema) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.3 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini API error: ${await response.text()}`);
  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty Gemini response");
  return JSON.parse(raw);
}

function schema() {
  return {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        id: { type: "STRING" },
        ...Object.fromEntries(LANG_KEYS.map((k) => [k, { type: "ARRAY", items: { type: "STRING" } }])),
      },
      required: ["id", ...LANG_KEYS],
    },
  };
}

async function main() {
  const sentences = await redis.get("game-content:sentences");
  if (!Array.isArray(sentences) || sentences.length === 0) {
    console.log("No AI-generated sentences in Redis — nothing to backfill.");
    return;
  }

  const needsBackfill = sentences.filter((s) => !s.pronunciation);
  console.log(`${sentences.length} sentences total, ${needsBackfill.length} missing pronunciation.`);
  if (needsBackfill.length === 0) return;

  const inputForGemini = needsBackfill.map((s) => ({
    id: s.id,
    ...Object.fromEntries(LANG_KEYS.map((k) => [k, s.translations[k]])),
  }));

  const prompt = `For each of these sentences, add romanized (Latin-letter) pronunciation for every word already given, in the same language, same order, same array length. Do NOT change, add, or remove any words — only provide their pronunciation.

${JSON.stringify(inputForGemini, null, 2)}

Respond with a JSON array where each item has the same "id" plus one array per language with that language's pronunciation, one entry per word in the same order as given above.`;

  const raw = await callGemini(prompt, schema());
  if (!Array.isArray(raw)) throw new Error("Unexpected response shape");

  const byId = new Map(raw.map((item) => [item.id, item]));
  let patched = 0;

  const updatedSentences = sentences.map((s) => {
    if (s.pronunciation) return s;
    const result = byId.get(s.id);
    if (!result) return s;

    const pronunciation = {};
    for (const lang of LANG_KEYS) {
      const words = s.translations[lang];
      const pron = result[lang];
      if (!Array.isArray(pron) || pron.length !== words.length) continue;
      const cleanPron = pron.map((w) => String(w).trim()).filter(Boolean);
      if (cleanPron.length !== words.length || !cleanPron.every(isRomanized)) continue;
      pronunciation[lang] = cleanPron;
    }
    if (Object.keys(pronunciation).length === 0) return s;
    patched++;
    return { ...s, pronunciation };
  });

  console.log(`Patched pronunciation onto ${patched} / ${needsBackfill.length} sentences.`);
  await redis.set("game-content:sentences", updatedSentences);
  console.log("Wrote updated game-content:sentences to Redis.");
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});

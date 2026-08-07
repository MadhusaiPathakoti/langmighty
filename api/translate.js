import { LANGUAGES, INPUT_LANGUAGES, DEFAULT_LANGUAGE_KEYS, DEFAULT_INPUT_LANGUAGE_KEY } from "../src/languages.js";

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const VALID_KEYS = new Set(LANGUAGES.map((l) => l.key));
const VALID_INPUT_KEYS = new Set(INPUT_LANGUAGES.map((l) => l.key));

function languageSchema() {
  return {
    type: "OBJECT",
    properties: {
      translation: { type: "STRING" },
      pronunciation: { type: "STRING" },
    },
    required: ["translation", "pronunciation"],
  };
}

function buildResponseSchema(keys) {
  const properties = {};
  keys.forEach((key) => {
    properties[key] = languageSchema();
  });
  return { type: "OBJECT", properties, required: keys };
}

function buildPrompt(keys, sourceLabel, text) {
  const languageLines = keys
    .map((key) => {
      const lang = LANGUAGES.find((l) => l.key === key);
      return `- ${lang.label}: write the "translation" using ${lang.label}'s own native script only (e.g. "${lang.nativeName}"). Never use another language's script.`;
    })
    .join("\n");

  return `Translate the following ${sourceLabel} text into: ${keys.map((k) => LANGUAGES.find((l) => l.key === k).label).join(", ")}.

For each language provide:
- "translation": the translated sentence, written strictly in that language's own native script (see script rules below). Do not mix scripts between languages.
- "pronunciation": a romanized (English letters) phonetic transliteration of the translation, easy for an English speaker to read aloud.

Script rules — follow exactly, one language must never borrow another's script:
${languageLines}

${sourceLabel} text: "${text}"

Respond only with JSON matching the required schema.`;
}

// Returns the subset of `keys` whose translation isn't actually written in that
// language's own script — this is how we catch the model mixing up scripts
// between similar-looking requests (e.g. writing Kannada text in Telugu script).
function findScriptMismatches(result, keys) {
  return keys.filter((key) => {
    const lang = LANGUAGES.find((l) => l.key === key);
    const translation = result?.[key]?.translation;
    return !translation || !lang.script.test(translation);
  });
}

async function callGemini(apiKey, prompt, schema) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error:", errText);
    throw new Error("Translation service is unavailable right now. Please try again.");
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    throw new Error("Received an empty response from the translation service.");
  }
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text, languages, sourceLanguage } = req.body || {};
  if (!text || !text.trim()) {
    res.status(400).json({ error: "Please enter some text to translate." });
    return;
  }

  const sourceKey = VALID_INPUT_KEYS.has(sourceLanguage) ? sourceLanguage : DEFAULT_INPUT_LANGUAGE_KEY;

  let keys = Array.isArray(languages) ? languages.filter((k) => VALID_KEYS.has(k) && k !== sourceKey) : [];
  if (keys.length === 0) keys = DEFAULT_LANGUAGE_KEYS.filter((k) => k !== sourceKey);
  if (keys.length === 0) keys = LANGUAGES.map((l) => l.key).filter((k) => k !== sourceKey);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Add it to your .env file locally, or your Vercel project's environment variables in production.",
    });
    return;
  }

  const sourceLabel = INPUT_LANGUAGES.find((l) => l.key === sourceKey).label;

  try {
    let result = await callGemini(apiKey, buildPrompt(keys, sourceLabel, text), buildResponseSchema(keys));

    let badKeys = findScriptMismatches(result, keys);
    if (badKeys.length > 0) {
      // The model occasionally writes one language's text in another language's
      // script (e.g. Kannada text rendered in Telugu characters). Re-ask just for
      // the languages that failed the script check before giving up on them.
      try {
        const retryResult = await callGemini(apiKey, buildPrompt(badKeys, sourceLabel, text), buildResponseSchema(badKeys));
        for (const key of badKeys) {
          if (findScriptMismatches(retryResult, [key]).length === 0) {
            result[key] = retryResult[key];
          }
        }
      } catch (retryErr) {
        console.error("Translate retry error:", retryErr);
      }

      // Still wrong after the retry: drop it rather than show incorrect text.
      badKeys = findScriptMismatches(result, keys);
      for (const key of badKeys) {
        console.error(`Dropping ${key}: model kept returning the wrong script.`);
        delete result[key];
      }
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Translate handler error:", err);
    res.status(500).json({ error: err.message || "Something went wrong while translating. Please try again." });
  }
}

import { LANGUAGES, DEFAULT_LANGUAGE_KEYS } from "../src/languages.js";

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const VALID_KEYS = new Set(LANGUAGES.map((l) => l.key));

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text, languages } = req.body || {};
  if (!text || !text.trim()) {
    res.status(400).json({ error: "Please enter some text to translate." });
    return;
  }

  let keys = Array.isArray(languages) ? languages.filter((k) => VALID_KEYS.has(k)) : [];
  if (keys.length === 0) keys = DEFAULT_LANGUAGE_KEYS;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Add it to your .env file locally, or your Vercel project's environment variables in production.",
    });
    return;
  }

  const languageNames = keys.map((key) => LANGUAGES.find((l) => l.key === key).label).join(", ");

  const prompt = `Translate the following English text into ${languageNames}.
For each language provide:
- "translation": the translated sentence written in the language's native script.
- "pronunciation": a romanized (English letters) phonetic transliteration of the translation, easy for an English speaker to read aloud.

English text: "${text}"

Respond only with JSON matching the required schema.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: buildResponseSchema(keys),
            temperature: 0.2,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      res.status(502).json({ error: "Translation service is unavailable right now. Please try again." });
      return;
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      res.status(502).json({ error: "Received an empty response from the translation service." });
      return;
    }

    const result = JSON.parse(raw);
    res.status(200).json(result);
  } catch (err) {
    console.error("Translate handler error:", err);
    res.status(500).json({ error: "Something went wrong while translating. Please try again." });
  }
}

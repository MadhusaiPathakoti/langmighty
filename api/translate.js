const GEMINI_MODEL = "gemini-2.5-flash";

function languageSchema() {
  return {
    type: "OBJECT",
    properties: {
      translation: { type: "STRING" },
      script: { type: "STRING" },
      pronunciation: { type: "STRING" },
    },
    required: ["translation", "script", "pronunciation"],
  };
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    kannada: languageSchema(),
    malayalam: languageSchema(),
    tamil: languageSchema(),
  },
  required: ["kannada", "malayalam", "tamil"],
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text } = req.body || {};
  if (!text || !text.trim()) {
    res.status(400).json({ error: "Please enter some text to translate." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Add it in your Vercel project's environment variables.",
    });
    return;
  }

  const prompt = `Translate the following English text into Kannada, Malayalam, and Tamil.
For each language provide:
- "translation": the translated sentence written in the language's native script.
- "script": the same translated sentence written in the language's native script.
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
            responseSchema: RESPONSE_SCHEMA,
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

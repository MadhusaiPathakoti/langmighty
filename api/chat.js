const GEMINI_MODEL = "gemini-3.5-flash-lite";
const MAX_HISTORY_TURNS = 16;

const SYSTEM_INSTRUCTION = `You are the AI language tutor inside Linguist.ai, a learning app for English, Telugu, Hindi, Kannada, Malayalam, and Tamil.

Only help with language-learning topics: grammar, vocabulary, pronouns, verb forms, sentence structure, phrases, pronunciation, cultural usage notes, and practice exercises for these languages. If asked about anything unrelated to language learning, briefly say you can only help with language learning and invite a related question.

When teaching a grammar point (e.g. "teach me pronouns in Kannada"):
- Cover the full set of relevant items (e.g. all personal pronouns), not just one or two examples.
- For every word or example sentence, always give three things together: the native script, a roman (English-letter) pronunciation guide, and an English translation or explanation.
- When listing multiple items, prefer a markdown table with columns such as "Kannada | Pronunciation | English".
- Add brief usage notes (formal vs informal, singular vs plural, etc.) where relevant.
- Keep formatting clean using markdown headings, bold text, and tables; avoid walls of unformatted text.

Be encouraging and concise. If the user doesn't say which language they mean, ask.`;

function toGeminiContents(history, message) {
  const trimmed = history.slice(-MAX_HISTORY_TURNS);
  const contents = trimmed
    .filter((turn) => turn && typeof turn.content === "string" && turn.content.trim())
    .map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    }));
  contents.push({ role: "user", parts: [{ text: message }] });
  return contents;
}

async function callGemini(apiKey, contents) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        generationConfig: { temperature: 0.4 },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini chat API error:", errText);
    throw new Error("The AI tutor is unavailable right now. Please try again.");
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) {
    throw new Error("Received an empty response from the AI tutor.");
  }
  return reply;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message, history } = req.body || {};
  if (!message || !message.trim()) {
    res.status(400).json({ error: "Please enter a message." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Add it to your .env file locally, or your Vercel project's environment variables in production.",
    });
    return;
  }

  try {
    const reply = await callGemini(apiKey, toGeminiContents(Array.isArray(history) ? history : [], message.trim()));
    res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat handler error:", err);
    res.status(500).json({ error: err.message || "Something went wrong. Please try again." });
  }
}

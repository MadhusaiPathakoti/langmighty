import { EdgeTTS } from "edge-tts-universal";
import { LANGUAGES } from "../src/languages.js";

const ALLOWED_VOICES = new Set(LANGUAGES.map((l) => l.ttsVoice));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text, voice } = req.body || {};
  if (!text || !text.trim()) {
    res.status(400).json({ error: "No text provided to speak." });
    return;
  }
  if (!voice || !ALLOWED_VOICES.has(voice)) {
    res.status(400).json({ error: "Unsupported voice." });
    return;
  }

  try {
    const tts = new EdgeTTS(text, voice);
    const { audio } = await tts.synthesize();
    const buffer = Buffer.from(await audio.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.statusCode = 200;
    res.end(buffer);
  } catch (err) {
    console.error("TTS handler error:", err);
    res.status(502).json({ error: "Could not generate audio right now. Please try again." });
  }
}

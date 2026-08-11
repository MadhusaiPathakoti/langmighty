import { applyCors } from "./_lib/cors.js";
import { getRedis } from "./_lib/redisCache.js";

const PHRASES_KEY = "game-content:phrases";
const SENTENCES_KEY = "game-content:sentences";

// Serves AI-generated Playground content that was bulk-generated once (via
// scripts/seedGameContent.mjs) and cached permanently in Redis. Gameplay reads
// from here (or falls back to the app's static bank if empty/unconfigured) —
// this route never calls Gemini itself, so it's free to hit on every game load.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { type } = req.query || {};
  if (type !== "phrases" && type !== "sentences") {
    res.status(400).json({ error: "type must be 'phrases' or 'sentences'" });
    return;
  }

  const redis = getRedis();
  if (!redis) {
    res.status(200).json(type === "phrases" ? { phrases: [] } : { sentences: [] });
    return;
  }

  try {
    const key = type === "phrases" ? PHRASES_KEY : SENTENCES_KEY;
    const data = await redis.get(key);
    const list = Array.isArray(data) ? data : [];
    res.status(200).json(type === "phrases" ? { phrases: list } : { sentences: list });
  } catch (err) {
    console.error("game-content read error:", err);
    res.status(200).json(type === "phrases" ? { phrases: [] } : { sentences: [] });
  }
}

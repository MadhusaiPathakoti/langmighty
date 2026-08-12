import { applyCors } from "./_lib/cors.js";
import { getRedis } from "./_lib/redisCache.js";

// Maps each `type` to its Redis key and the response field name gameplay code
// expects. Sentence-shaped types all respond under "sentences" regardless of
// difficulty tier, since callers (loadExtraSentences/ShortSentences/
// LongSentences in the client) all read that same field.
const TYPES = {
  phrases: { key: "game-content:phrases", field: "phrases" },
  sentences: { key: "game-content:sentences", field: "sentences" },
  "short-sentences": { key: "game-content:short-sentences", field: "sentences" },
  "long-sentences": { key: "game-content:long-sentences", field: "sentences" },
};

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
  const config = TYPES[type];
  if (!config) {
    res.status(400).json({ error: `type must be one of: ${Object.keys(TYPES).join(", ")}` });
    return;
  }

  const redis = getRedis();
  if (!redis) {
    res.status(200).json({ [config.field]: [] });
    return;
  }

  try {
    const data = await redis.get(config.key);
    const list = Array.isArray(data) ? data : [];
    res.status(200).json({ [config.field]: list });
  } catch (err) {
    console.error("game-content read error:", err);
    res.status(200).json({ [config.field]: [] });
  }
}

import { applyCors } from "./_lib/cors.js";
import { getRedis } from "./_lib/redisCache.js";
import { requireSignedIn } from "./_lib/creditGate.js";
import { checkAndConsumeUsage } from "./_lib/usageLimits.js";
import { isAdminUser } from "./_lib/adminAuth.js";

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

// Must stay in sync with the GAMES ids in src/components/PlaygroundView.jsx —
// each one gets its own once-per-day play credit (see checkAndConsumeUsage's
// subKey param), not a shared pool across all 8 games.
const GAME_IDS = new Set([
  "read-aloud",
  "quiz",
  "word-match",
  "speed-translate",
  "listen-guess",
  "word-chain",
  "guess-sentence",
  "roleplay",
]);

// A POST here doesn't fetch content — it consumes one daily "play" credit for
// entering the specified Playground game. Folded into this existing route
// rather than a new file: api/ is already at Vercel Hobby's 12-Serverless-
// Function cap (see CLAUDE.md), so any new free-tier metering has to reuse an
// existing route.
async function handlePlayCheck(req, res) {
  const { gameId } = req.body || {};
  if (!GAME_IDS.has(gameId)) {
    res.status(400).json({ error: `gameId must be one of: ${[...GAME_IDS].join(", ")}` });
    return;
  }

  const authResult = await requireSignedIn(req, res);
  if (!authResult) return;
  if (!authResult.signedIn || (await isAdminUser(authResult.user.id))) {
    res.status(200).json({ used: 0, limit: null });
    return;
  }

  const usage = await checkAndConsumeUsage(authResult.user.id, "game", res, gameId);
  if (!usage) return;
  res.status(200).json(usage);
}

// Serves AI-generated Playground content that was bulk-generated once (via
// scripts/seedGameContent.mjs) and cached permanently in Redis. Gameplay reads
// from here (or falls back to the app's static bank if empty/unconfigured) —
// this route never calls Gemini itself, so it's free to hit on every game load.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method === "POST") {
    await handlePlayCheck(req, res);
    return;
  }

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

import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function readDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return {};

  const result = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    result[key] = value;
  }
  return result;
}

function injectEnv(keys) {
  const env = readDotEnv();
  for (const key of keys) {
    if (env[key]) process.env[key] = env[key];
    else delete process.env[key];
  }
}

async function prepareApiRequest(req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf-8");
    req.body = raw ? JSON.parse(raw) : {};
  } catch {
    req.body = {};
  }

  // Vercel's real request object parses query params automatically; the local
  // dev server doesn't, so GET routes (e.g. game-content) need it done here.
  req.query = Object.fromEntries(new URL(req.url, "http://localhost").searchParams);

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  };
}

function localApiPlugin() {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use("/api/translate", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        await prepareApiRequest(req, res);

        injectEnv([
          "GEMINI_API_KEY",
          "VITE_SUPABASE_URL",
          "SUPABASE_SERVICE_ROLE_KEY",
          "UPSTASH_REDIS_REST_URL",
          "UPSTASH_REDIS_REST_TOKEN",
        ]);

        const { default: handler } = await server.ssrLoadModule("/api/translate.js");
        await handler(req, res);
      });

      server.middlewares.use("/api/chat", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        await prepareApiRequest(req, res);

        injectEnv(["GEMINI_API_KEY", "VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

        const { default: handler } = await server.ssrLoadModule("/api/chat.js");
        await handler(req, res);
      });

      server.middlewares.use("/api/tts", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        await prepareApiRequest(req, res);

        const { default: handler } = await server.ssrLoadModule("/api/tts.js");
        await handler(req, res);
      });

      server.middlewares.use("/api/game-content", async (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end();
          return;
        }
        await prepareApiRequest(req, res);

        injectEnv(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]);

        const { default: handler } = await server.ssrLoadModule("/api/game-content.js");
        await handler(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
});

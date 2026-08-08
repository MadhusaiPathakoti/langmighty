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

async function prepareApiRequest(req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf-8");
    req.body = raw ? JSON.parse(raw) : {};
  } catch {
    req.body = {};
  }

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

        const key = readDotEnv().GEMINI_API_KEY;
        if (key) {
          process.env.GEMINI_API_KEY = key;
        } else {
          delete process.env.GEMINI_API_KEY;
        }

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

        const key = readDotEnv().GEMINI_API_KEY;
        if (key) {
          process.env.GEMINI_API_KEY = key;
        } else {
          delete process.env.GEMINI_API_KEY;
        }

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
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
});

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

function localApiPlugin() {
  return {
    name: "local-translate-api",
    configureServer(server) {
      server.middlewares.use("/api/translate", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }

        try {
          let raw = "";
          for await (const chunk of req) raw += chunk;
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

        const key = readDotEnv().GEMINI_API_KEY;
        if (key) {
          process.env.GEMINI_API_KEY = key;
        } else {
          delete process.env.GEMINI_API_KEY;
        }

        const { default: handler } = await server.ssrLoadModule("/api/translate.js");
        await handler(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
});

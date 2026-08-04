# LangLearn AI

A chat-style translator: type an English sentence and get back **Kannada**, **Malayalam**, and
**Tamil** translations with romanized pronunciation, real spoken audio, and PDF export of the whole
conversation. Frontend is React (Vite); translation runs through a serverless function backed by
Google's **free-tier** Gemini API, and voice playback runs through Microsoft Edge's free neural TTS
engine — so the whole thing costs nothing to run.

## 1. Get a free Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with a Google account.
2. Click **Create API key** — no credit card or billing account required for the free tier.
3. Copy the key.

The free tier has a request-per-minute/day rate limit, which is plenty for personal use. If you ever
exceed it, the app will just show a friendly error until the quota resets.

## 2. Run locally

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
```

Create a `.env` file (copy `.env.example`) and paste in your key:

```bash
GEMINI_API_KEY=your-key-here
```

Run:

```bash
npm run dev
```

Open `http://localhost:5173`. In dev mode, Vite serves `/api/translate` and `/api/tts` itself (see
`vite.config.js`) by running the exact same handlers used in production — no extra tooling needed.
Voice playback needs no API key at all.

## 3. Deploy for free on Vercel

The easiest way — no CLI required:

1. Push this repo to GitHub (already done if you're reading this from your repo).
2. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and import the repo.
   Vercel auto-detects the Vite + serverless function setup.
3. Before the first deploy, add an environment variable: `GEMINI_API_KEY` = your key.
4. Click **Deploy**.

You'll get a permanent `https://your-project.vercel.app` URL that's free to host and available any
time. Every push to `main` redeploys automatically.

> Prefer the CLI? `npm install -g vercel` then `vercel` / `vercel --prod` works too, but the Vercel
> CLI requires Node 20+ — if you're on an older Node locally, use the dashboard method above instead.

## Features

- **Chat-style conversation** — every sentence you translate becomes a turn in an ongoing thread
  (like a chat app), not a one-shot form. Conversation persists in your browser across reloads.
- Each turn shows translation + romanized pronunciation for Kannada, Malayalam, and Tamil.
- 🔊 **Listen buttons play real, natural-sounding audio** generated server-side via Microsoft Edge's
  neural voices — no browser voice packs or OS language installs required, works the same on every
  device (desktop, tablet, mobile).
- **Export to PDF** — downloads a `translation_<timestamp>.pdf` with the **entire conversation**,
  every turn numbered in order (native scripts render correctly since the PDF is generated from the
  rendered page).
- Light/dark mode toggle, copy-to-clipboard on translations.

## Tech stack

- React + Vite, Tailwind CSS
- Vercel serverless function (`api/translate.js`) calling the Gemini API with a structured JSON
  response schema
- Vercel serverless function (`api/tts.js`) using [`edge-tts-universal`](https://github.com/travisvn/edge-tts-universal)
  to generate audio via Microsoft Edge's free neural TTS voices (`kn-IN-SapnaNeural`,
  `ml-IN-SobhanaNeural`, `ta-IN-PallaviNeural`). This uses the same undocumented-but-widely-relied-on
  protocol that powers Edge's built-in "Read Aloud" feature — it's not an officially published
  Microsoft API, but the underlying method has been stable for years and is used by a large open-source
  ecosystem.
- `html2canvas` + `jspdf` for client-side PDF export

### Note on the `patches/` folder

`edge-tts-universal@1.4.0` has a real bug: it mis-encodes any non-Latin-1 text (i.e. any Kannada,
Malayalam, or Tamil script) before sending it for synthesis, so translated text silently produced no
audio. `patches/edge-tts-universal+1.4.0.patch` (applied automatically via `postinstall` +
[`patch-package`](https://github.com/ds300/patch-package)) fixes this along with a related bug in the
SSML's declared language. No action needed — `npm install` reapplies it automatically.

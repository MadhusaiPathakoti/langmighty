# LangLearn AI

Translate English into **Kannada**, **Malayalam**, and **Tamil** — with native script, romanized
pronunciation, text-to-speech, and PDF export. Frontend is React (Vite); translation runs through a
serverless function backed by Google's **free-tier** Gemini API, so it costs nothing to run.

## 1. Get a free Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with a Google account.
2. Click **Create API key** — no credit card or billing account required for the free tier.
3. Copy the key.

The free tier has a request-per-minute/day rate limit, which is plenty for personal use. If you ever
exceed it, the app will just show a friendly error until the quota resets.

## 2. Run locally

Requires [Node.js](https://nodejs.org) 18+ and the [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm install -g vercel
npm install
```

Create a `.env` file (copy `.env.example`) and paste in your key:

```bash
GEMINI_API_KEY=your-key-here
```

Run the app with `vercel dev` (this serves both the React frontend and the `/api/translate`
serverless function together, exactly like production):

```bash
vercel dev
```

Open the URL it prints (usually `http://localhost:3000`).

> Note: plain `npm run dev` (Vite only) will run the UI but `/api/translate` won't exist, so
> translation requests will fail — always use `vercel dev` for the full app locally.

## 3. Deploy for free on Vercel

```bash
vercel
```

Follow the prompts to link/create a project. Then add your API key as a project environment
variable (only needs to be done once):

```bash
vercel env add GEMINI_API_KEY
```

Paste your key when prompted, select all environments, then deploy to production:

```bash
vercel --prod
```

You'll get a permanent `https://your-project.vercel.app` URL that's free to host and available any time.

## Features

- Single input box → structured translations for Kannada, Malayalam, and Tamil (translation, native
  script, romanized pronunciation).
- 🔊 Listen buttons use the browser's built-in speech synthesis (`kn-IN`, `ml-IN`, `ta-IN`). If your
  browser/OS has no voice for a language, the button is disabled with a tooltip instead of failing.
- **Export to PDF** — downloads a `translation_<timestamp>.pdf` with the English input and full
  results table (native scripts render correctly since the PDF is generated from the rendered page).
- Last 5 searches saved locally in your browser (click one to reload it instantly).
- Light/dark mode toggle, copy-to-clipboard on translations.

## Tech stack

- React + Vite, Tailwind CSS
- Vercel serverless function (`api/translate.js`) calling the Gemini API with a structured JSON
  response schema
- `html2canvas` + `jspdf` for client-side PDF export
- Browser `SpeechSynthesis` API for voice output

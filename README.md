# Linguist.ai

Live app: **[linguist-ai-two.vercel.app](https://linguist-ai-two.vercel.app/)**

A chat-style translator between English, Telugu, Hindi, Kannada, Malayalam, and Tamil — any of
these languages to any other. Type a sentence and get back translations with romanized
pronunciation, real spoken audio, and PDF export of the whole conversation.

## Features

- **Chat-style conversation** — every sentence you translate becomes a turn in an ongoing thread,
  not a one-shot form. Conversation persists in your browser across reloads.
- **Any language to any language** — pick the language you type in and, separately, which of the
  remaining languages to translate into. Input is validated against the selected input language's
  script before it's sent.
- Each turn shows translation + romanized pronunciation for every selected output language.
- 🔊 **Real spoken audio** on Listen buttons, generated server-side via Microsoft Edge's neural
  voices — works the same on every device without any browser voice packs or OS language installs.
- **Export to PDF** — the entire conversation, every turn numbered in order, with native scripts
  rendering correctly.
- **Roadmap** — a structured, 21-stage beginner-to-advanced learning path per language (alphabet →
  guninthalu → words → grammar → conversations → role-play), each stage with real script examples,
  romanization, and English meaning. Downloadable as its own PDF per language.
- Light/dark mode, copy-to-clipboard on translations.

## How to use it

1. Open the [live app](https://linguist-ai-two.vercel.app/).
2. In **Preferences**, set the language you'll type in and the languages to translate into.
3. Type a sentence and send it — get translations, pronunciation, and a Listen button for each
   output language.
4. Use **Roadmap** to work through a structured path for learning a specific language from scratch.
5. Export the conversation (or a roadmap) to PDF any time to keep or share it.

## Tech stack

- React + Vite, Tailwind CSS
- Vercel serverless function (`api/translate.js`) calling the Gemini API with a structured JSON
  response schema
- Vercel serverless function (`api/tts.js`) using [`edge-tts-universal`](https://github.com/travisvn/edge-tts-universal)
  for Microsoft Edge's free neural TTS voices
- `html2canvas` + `jspdf` for client-side PDF export

## What's next

- AI tutor module for personalized, self-paced adaptive tutoring
- Support for more Indian languages
- Progress tracking for the Roadmap

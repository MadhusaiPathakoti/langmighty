# LangMighty

Live app: **[linguist-ai-two.vercel.app](https://linguist-ai-two.vercel.app/)**

A chat-style translator between English, Telugu, Hindi, Kannada, Malayalam, and Tamil — any of
these languages to any other. Type a sentence and get back translations with romanized
pronunciation, real spoken audio, a shareable handwritten-note image, and PDF export of the whole
conversation.

## Features

### Translation & conversation

- **Chat-style conversation** — every sentence you translate becomes a turn in an ongoing thread,
  not a one-shot form. Conversation persists in your browser across reloads.
- **Any language to any language** — pick the language you type in and, separately, which of the
  remaining languages to translate into. Input is validated against the selected input language's
  script before it's sent.
- Each turn shows translation + romanized pronunciation for every selected output language.
- **Script-mismatch protection** — the backend checks that every translation is actually written in
  that language's own script (not, say, Kannada text accidentally rendered in Telugu characters),
  automatically retries any language that comes back wrong, and drops it rather than showing
  incorrect text if it's still wrong after the retry.
- 🔊 **Real spoken audio** on Listen buttons, generated server-side via Microsoft Edge's neural
  voices — works the same on every device without any browser voice packs or OS language installs.
- Copy-to-clipboard on any translation.
- **Delete a message** — remove any turn from the conversation (and from local storage) with the
  🗑 button next to it, e.g. if a translation came back wrong.
- **Export to PDF** — the entire conversation, every turn numbered in order, with native scripts
  rendering correctly.

### Share as a handwritten note

Turn any translated turn into a shareable notebook-style image for social media, via **✎ Share as
handwritten note** under each translated turn.

- **Paper backgrounds** — Ruled Notebook, Dot Grid Journal, Kraft Paper, Chalkboard, and Sticky
  Note, all rendered in pure CSS (crisp at any size, no image assets to manage) — or **upload your
  own photo** as the background instead.
- **Handwriting fonts** — Caveat, Kalam, Patrick Hand, Indie Flower, or Shadow Into Light for the
  English line and romanized pronunciation.
- **Native script style** — Rounded (playful Baloo family) or Clean (Noto Sans) for the native-script
  translations.
- **Text size** — zoom the text from 70% to 160% with a slider or +/− buttons.
- **Rotation** — tilt the whole note from −15° to 15°.
- **Pan/reposition** — click and drag the note in the preview to move the text anywhere over the
  background.
- **Image size** — export as Portrait (1080×1350, 4:5), Square (1080×1080), or Landscape
  (1080×566), matched to common social media formats.
- Downloads as a PNG at the exact resolution you picked.

### Roadmap

- A structured, 21-stage beginner-to-advanced learning path per language (alphabet → guninthalu →
  words → grammar → conversations → role-play), each stage with real script examples, romanization,
  and English meaning.
- Downloadable as its own PDF per language.

### General

- Light/dark mode.

## How to use it

1. Open the [live app](https://linguist-ai-two.vercel.app/).
2. In **Preferences**, set the language you'll type in and the languages to translate into.
3. Type a sentence and send it — get translations, pronunciation, and a Listen button for each
   output language.
4. Click **✎ Share as handwritten note** under any translated turn to generate a shareable image —
   pick a background, font, size, and position, then download the PNG.
5. Use **Roadmap** to work through a structured path for learning a specific language from scratch.
6. Export the conversation (or a roadmap) to PDF any time to keep or share it.

## Tech stack

- React + Vite, Tailwind CSS
- Vercel serverless function (`api/translate.js`) calling the Gemini API with a structured JSON
  response schema, plus script validation and automatic retry for mismatched-script translations
- Vercel serverless function (`api/tts.js`) using [`edge-tts-universal`](https://github.com/travisvn/edge-tts-universal)
  for Microsoft Edge's free neural TTS voices
- `html2canvas` for client-side image/PDF rendering, `jspdf` for PDF export

## What's next

- AI tutor module for personalized, self-paced adaptive tutoring
- Support for more Indian languages
- Progress tracking for the Roadmap

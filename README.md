# LangMighty

**Learn. Speak. Connect. 🌍**

Live app: **[LangMighty](https://langmighty.in/)**

A chat-style translator between English, Telugu, Hindi, Kannada, Malayalam, and Tamil — any of these languages to any other. Type a sentence and get back translations with romanized pronunciation, real spoken audio, a shareable handwritten-note image, and PDF export of the whole conversation.

Also includes an AI language tutor you can chat with about grammar, vocabulary, pronunciation, and language usage, plus a Playground of six practice games.

## 🌐 Connect with LangMighty

- 📸 **Instagram:** [@langmighty](https://www.instagram.com/langmighty/)
- ▶️ **YouTube:** [LangMighty](https://www.youtube.com/channel/UCCFXBeqeHcRqLpQ6bgxaRsQ)

## Features

### Free usage & sign-in

- **3 free prompts** across Translate and AI Chat combined, tracked server-side (not just in the
  browser) so it can't be bypassed by clearing storage, using incognito, or calling the API
  directly.
- After that, **sign in with Google** (via Supabase Auth) for unlimited use — with a clear,
  unchecked-by-default opt-in checkbox for product update emails at signup, not a dark pattern.
- **Playground games never use credits or require sign-in** — they're fully client-side and free to
  play as much as you like, regardless of Translate/AI Chat usage.
- Every completed translation includes a **Regenerate** button to force a fresh answer instead of a
  cached one, for when a cached translation wasn't quite right.

### AI Chat tutor

Ask free-form language-learning questions — grammar, vocabulary, pronouns, verb forms, pronunciation,
usage — for English, Telugu, Hindi, Kannada, Malayalam, or Tamil, and get back an answer with native
script, romanized pronunciation, and an English explanation for every example, formatted with
markdown tables and headings where helpful.

- **Free-form conversation** — ask anything language-related, e.g. "teach me pronouns in Kannada
  with examples" or "how do I say thank you formally in Tamil?"
- Multi-turn context — follow-up questions ("phase-1", "give more examples") understand what was
  asked before.
- Conversation persists in your browser across reloads; **delete a message and its reply together**
  (deleting your prompt removes the AI's answer with it, not just the question), or clear the whole
  chat.
- **Export to PDF** — the full transcript, including any markdown tables, exported as a paginated
  PDF with page breaks placed between messages rather than through the middle of a table row.
- Powered by Google Gemini's free tier — same backend approach as the translator.

### Translation & conversation

- **Chat-style conversation** — every sentence you translate becomes a turn in an ongoing thread,
  not a one-shot form. Conversation persists in your browser across reloads.
- **Any language to any language** — pick the language you type in and, separately, which of the
  remaining languages to translate into. Input is validated against the selected input language's
  script before it's sent.
- Each turn shows translation + romanized pronunciation for every selected output language.
- **Script-mismatch protection** — the backend checks that every translation is written *entirely*
  in that language's own script (not just that it contains some of it — catching subtle
  contamination like a single stray character borrowed from a visually similar script in another
  language), automatically retries any language that comes back wrong, and drops it rather than
  showing incorrect text if it's still wrong after the retry.
- **Cached in Redis** — repeated identical translation requests are served from cache instead of
  calling Gemini again, cutting latency and API usage for common phrases; **Regenerate** bypasses
  the cache on demand and refreshes it with the new result.
- 🔊 **Real spoken audio** on Listen buttons, generated server-side via Microsoft Edge's neural
  voices — works the same on every device without any browser voice packs or OS language installs.
- Copy-to-clipboard on any translation.
- **Delete a message** — remove any turn from the conversation (and from local storage) with the
  🗑 button next to it, e.g. if a translation came back wrong.
- **Export to PDF** — the entire conversation, every turn numbered in order, with native scripts
  rendering correctly and page breaks placed between turns rather than through a table row.

### Playground

Six practice games, all free to play with no sign-in or credits required — every game draws from a
shared bank of curated vocabulary and sentences, supplemented by AI-generated content cached in
Redis (see [Tech stack](#tech-stack)), with logic that avoids repeating recently-seen content until
the whole pool has cycled through.

- **🧠 Language Quiz** — multiple-choice: guess the correct translation of an English word among
  four same-script options. Wrong answers prompt a retry rather than revealing the answer; filter
  by language (or mixed) and by topic (greetings, animals, verbs, numbers, and more).
- **🧩 Word Match** — tap an English word, then find its matching translation in a shuffled grid.
  Tracks mistakes; same language/topic filters as the quiz.
- **⚡ Speed Translate** — 60 seconds on the clock, multiple-choice, every answer (right or wrong)
  advances immediately to keep the pace up; ends with a review of exactly which words you missed
  and their correct answers.
- **🎧 Listen & Guess** — hear a word spoken aloud (real TTS audio, replayable), then pick the
  matching written option from four choices in the same script — tests listening comprehension, not
  script recognition.
- **🔗 Word Chain** — given an English sentence, tap words from a shuffled bank in the correct order
  to build its translation; one language at a time (no topic filter, since sentences aren't
  categorized like single words).
- **📝 Guess the Sentence** — like the Language Quiz, but for full sentences instead of single
  words; every option shows its romanized pronunciation underneath.

### Share as a handwritten note

Turn any translated turn into a shareable notebook-style image for social media, via **✎ Share as
handwritten note** under each translated turn.

- **Paper backgrounds** — Ruled Notebook, Dot Grid Journal, Kraft Paper, Chalkboard, and Sticky
  Note, all rendered in pure CSS (crisp at any size, no image assets to manage); a set of photo
  backgrounds (notebook, wood desk, marble, and more); or **upload your own photo** as the
  background instead.
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
- **Download** the PNG directly at the exact resolution you picked, or **Share** straight to
  another app (e.g. Photos, Messages) on devices that support the native share sheet.

### Roadmap

- A structured, 21-stage beginner-to-advanced learning path per language (alphabet → guninthalu →
  words → grammar → conversations → role-play), each stage with real script examples, romanization,
  and English meaning.
- Downloadable as its own PDF per language.

### General

- Light/dark mode.

## How to use it

1. Open the [live app](https://langmighty.in/).
2. In **Preferences**, set the language you'll type in and the languages to translate into.
3. Type a sentence and send it — get translations, pronunciation, and a Listen button for each
   output language. You get 3 free prompts (shared with AI Chat) before you're asked to sign in with
   Google for unlimited use.
4. Click **✎ Share as handwritten note** under any translated turn to generate a shareable image —
   pick a background, font, size, and position, then download or share the PNG.
5. Use **AI Chat** to ask free-form questions about grammar, vocabulary, or pronunciation in any of
   the supported languages.
6. Use **Playground** to practice with six free games — no sign-in or credits needed.
7. Use **Roadmap** to work through a structured path for learning a specific language from scratch.
8. Export a conversation, chat, or roadmap to PDF any time to keep or share it.

## Tech stack

- React + Vite, Tailwind CSS
- Vercel serverless function (`api/translate.js`) calling the Gemini API with a structured JSON
  response schema, script-purity validation with automatic retry for mismatched-script
  translations, and an Upstash Redis cache (with a `Regenerate` bypass) to avoid re-calling Gemini
  for repeated requests
- Vercel serverless function (`api/chat.js`) calling the Gemini API with a language-tutor system
  prompt and multi-turn conversation history
- Vercel serverless function (`api/tts.js`) using [`edge-tts-universal`](https://github.com/travisvn/edge-tts-universal)
  for Microsoft Edge's free neural TTS voices
- **Supabase** for Google sign-in and a `profiles` table (email + marketing opt-in), with a
  server-side credit gate (`api/_lib/creditGate.js`) enforcing the 3-free-prompt limit via an
  `httpOnly` cookie plus a per-IP daily cap — not just a client-side counter
- **Upstash Redis** (`api/_lib/redisCache.js`) backing the translation cache, the credit gate's
  usage counters, and the Playground's AI-generated content library (`api/game-content.js`)
- One-time content-generation scripts (`scripts/seedGameContent.mjs`,
  `scripts/backfillSentencePronunciation.mjs`) that call Gemini to bulk-generate additional
  Playground vocabulary and sentences, validate every translation's script purity, and cache the
  result permanently in Redis — gameplay itself never calls Gemini, so Playground stays free and
  abuse-proof
- `react-markdown` + `remark-gfm` for rendering AI Chat replies (tables, headings, bold text)
- `html2canvas` for client-side image/PDF rendering, `jspdf` for PDF export

## What's next

- Support for more Indian languages
- Progress tracking for the Roadmap
- Script-mismatch protection for AI Chat replies, matching the translator's retry logic

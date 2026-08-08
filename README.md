# LangMighty

**Learn. Speak. Connect. 🌍**

Live app: **[LangMighty](https://langmighty.vercel.app/)**

A chat-style translator between English, Telugu, Hindi, Kannada, Malayalam, and Tamil — any of these languages to any other. Type a sentence and get back translations with romanized pronunciation, real spoken audio, a shareable handwritten-note image, and PDF export of the whole conversation.

Also includes an AI language tutor you can chat with about grammar, vocabulary, pronunciation, and language usage.

## 🌐 Connect with LangMighty

- 📸 **Instagram:** [@langmighty](https://www.instagram.com/langmighty/)
- ▶️ **YouTube:** [LangMighty](https://www.youtube.com/channel/UCCFXBeqeHcRqLpQ6bgxaRsQ)

## Features

### AI Chat tutor

Ask free-form language-learning questions — grammar, vocabulary, pronouns, verb forms, pronunciation,
usage — for English, Telugu, Hindi, Kannada, Malayalam, or Tamil, and get back an answer with native
script, romanized pronunciation, and an English explanation for every example, formatted with
markdown tables and headings where helpful.

- **Free-form conversation** — ask anything language-related, e.g. "teach me pronouns in Kannada
  with examples" or "how do I say thank you formally in Tamil?"
- Multi-turn context — follow-up questions ("phase-1", "give more examples") understand what was
  asked before.
- Conversation persists in your browser across reloads; delete individual messages or clear the
  whole chat.
- **Export to PDF** — the full transcript, including any markdown tables, exported as a paginated
  PDF with page breaks placed between messages rather than through the middle of a table row.
- Powered by Google Gemini's free tier — same backend approach as the translator, with no request
  limits imposed by the app itself.

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
  rendering correctly and page breaks placed between turns rather than through a table row.

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

1. Open the [live app](https://linguist-ai-two.vercel.app/).
2. In **Preferences**, set the language you'll type in and the languages to translate into.
3. Type a sentence and send it — get translations, pronunciation, and a Listen button for each
   output language.
4. Click **✎ Share as handwritten note** under any translated turn to generate a shareable image —
   pick a background, font, size, and position, then download or share the PNG.
5. Use **AI Chat** to ask free-form questions about grammar, vocabulary, or pronunciation in any of
   the supported languages.
6. Use **Roadmap** to work through a structured path for learning a specific language from scratch.
7. Export a conversation, chat, or roadmap to PDF any time to keep or share it.

## Tech stack

- React + Vite, Tailwind CSS
- Vercel serverless function (`api/translate.js`) calling the Gemini API with a structured JSON
  response schema, plus script validation and automatic retry for mismatched-script translations
- Vercel serverless function (`api/chat.js`) calling the Gemini API with a language-tutor system
  prompt and multi-turn conversation history
- Vercel serverless function (`api/tts.js`) using [`edge-tts-universal`](https://github.com/travisvn/edge-tts-universal)
  for Microsoft Edge's free neural TTS voices
- `react-markdown` + `remark-gfm` for rendering AI Chat replies (tables, headings, bold text)
- `html2canvas` for client-side image/PDF rendering, `jspdf` for PDF export

## What's next

- Support for more Indian languages
- Progress tracking for the Roadmap
- Script-mismatch protection for AI Chat replies, matching the translator's retry logic

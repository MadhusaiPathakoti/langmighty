# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LangMighty — a React + Vite chat-style translator between English, Telugu, Hindi, Kannada, Malayalam,
and Tamil, plus an AI language-tutor chat, a Playground of six practice games, and a per-language
learning Roadmap. Frontend is a static SPA; backend logic lives in Vercel serverless functions under
`api/`.

## Commands

```bash
npm run dev       # Vite dev server on :5173 — also serves /api/* locally, see below
npm run build     # production build to dist/
npm run preview   # preview the production build
```

There is no test suite and no lint script configured. There is no dedicated backend dev server — Vite
itself proxies `/api/*` requests to the handler files (see "Local API dev server" below), so
`npm run dev` is the only command needed for full-stack local development.

## Environment setup

Copy `.env.example` to `.env` and fill in:
- `GEMINI_API_KEY` — required for translate/chat/game-content generation
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — client-side Supabase (Google sign-in)
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never prefix with `VITE_`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — server-only, Redis cache
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — server-only, PDF store payments
- `PDF_STORE_PASSWORD_ENC_KEY` — server-only, encrypts per-purchase PDF passwords at rest

Every `api/_lib/*.js` client getter (`getRedis`, `getSupabaseAdmin`) reads env vars lazily on each
call rather than once at import time, and every feature is designed to fail open/gracefully when its
env vars are missing (e.g. credit gate allows requests unchecked, translate cache is skipped,
game-content returns empty arrays) — don't add hard crashes for missing config.

## Architecture

### Local API dev server (`vite.config.js`)

Vercel serverless functions (`api/*.js`) can't run standalone locally. `vite.config.js` defines a
`localApiPlugin` that registers Vite dev-server middleware for each `/api/*` route, reads `.env`
manually (Vite doesn't inject non-`VITE_`-prefixed vars into `process.env` for server code), and
`ssrLoadModule`s the corresponding handler in `api/`. **When adding a new API route file, you must
also register it in `vite.config.js`** (method check, env injection, `ssrLoadModule` call) or it will
404 in local dev while working fine on Vercel. `api/pdf-store/*` is the one exception: it's handled by
a single generic dispatcher keyed off the URL path segment (`/api/pdf-store/<name>` →
`ssrLoadModule("/api/pdf-store/<name>.js")`), so a new file under `api/pdf-store/` needs no new
middleware block — it just needs the route name to match `/^[a-z-]+$/`.

### Serverless API (`api/`)

- `translate.js` — calls Gemini with a structured JSON response schema (one object key per target
  language, each with `translation` + `pronunciation`). Enforces **script purity**: every
  translation must be written *entirely* in its target language's own Unicode script block (checked
  via `LANGUAGES[].script` regexes from `langmighty-shared`), not just contain some of it. Mismatches
  trigger one targeted retry for just the bad languages, then are dropped rather than shown wrong.
  Results are cached in Redis keyed by a hash of `sourceKey|sortedOutputKeys|text` (see
  `CACHE_VERSION` — bump it if `buildPrompt`/`buildResponseSchema` shape changes, so old cache entries
  don't get served against a new contract). `regenerate: true` bypasses the cache and refreshes it.
- `chat.js` — Gemini-backed language tutor with multi-turn history, same backend approach as
  translate.
- `tts.js` — Microsoft Edge neural TTS via `edge-tts-universal` (patched, see below).
- `game-content.js` — read-only endpoint serving AI-generated Playground vocab/sentences that were
  bulk-generated once by `scripts/seedGameContent.mjs` (and later backfilled for pronunciation by
  `scripts/backfillSentencePronunciation.mjs`) and cached permanently in Redis. Gameplay itself never
  calls Gemini, keeping Playground free and abuse-proof; falls back to an empty list (client falls
  back to its static bank) if Redis is unconfigured or empty.
- `_lib/creditGate.js` — server-side enforcement of the 3-free-prompt limit shared across
  Translate/AI Chat, keyed by an `X-Anon-Id` header (see `src/lib/apiClient.js`) plus a per-IP daily
  cap as backstop against discarding the anon id. A header is used instead of a server-set cookie so
  it behaves the same for the web app and a native WebView calling cross-origin. Signed-in users
  (verified via Supabase access token) are exempt. Every request handler that should be gated must
  call `enforceCreditGate(req, res)` and bail out (`return`) when it returns `null` — it has already
  written the response.
- `_lib/redisCache.js`, `_lib/supabaseAdmin.js` — lazy singleton clients, re-read env vars per call.
- `_lib/cors.js` — call `applyCors(req, res)` first in every handler; returns truthy for
  already-handled OPTIONS preflight, in which case the handler should return immediately.

### PDF store (`api/pdf-store/`)

A paid-PDF catalog (Razorpay checkout, per-purchase password-locked download) layered on top of the
same Supabase project as everything else:

- `admin.js` is a single action-dispatch endpoint (`{ action, ...body }` →
  `create-upload-url | finalize | list | update-price | set-active | delete`) rather than one file per
  admin operation, gated by `_lib/adminAuth.js`'s `requireAdmin()` (checks `profiles.is_admin`
  server-side on every call — never trust a client flag). `finalize` extracts the real page count and
  builds the public preview PDF at upload time by copying a **random** subset of pages (not the first
  N, so the preview can't be judged from just the opening pages) via `pdf-lib`.
- `create-order.js` / `verify-payment.js` — Razorpay order creation and HMAC signature verification
  (constant-time compare). On first successful verification, `verify-payment.js` generates a random
  password, re-encrypts the original PDF with it via `_lib/pdfLock.js` (locked copy stored separately
  in the private `pdf-store-locked` bucket), and stores the password encrypted at rest
  (`_lib/pdfPassword.js`, keyed by `PDF_STORE_PASSWORD_ENC_KEY`). Verification is idempotent and
  race-safe: it claims the purchase row with a conditional `status = 'created'` update so two
  concurrent calls for the same order can't both re-lock and re-charge the flow.
- `_lib/pdfLock.js` wraps `muhammara`, a native addon that only operates on file paths (round-trips
  through Vercel's writable `/tmp`), imported lazily so routes that don't touch encryption never pay
  to load it. Vercel needs the native binary explicitly bundled — see the `functions.includeFiles`
  entry for `api/pdf-store/verify-payment.js` in `vercel.json`; keep that in sync if the lock step
  moves to a different handler.
- `download.js` re-checks the buyer owns a `status = 'paid'` purchase and that the password they typed
  matches before minting a short-lived (120s) signed URL — the password gate isn't just client-side
  UX, it's required server-side on every download.
- Deleting a catalog item (`admin.js`'s `delete` action) is blocked once it has any paid purchases —
  buyers must keep download access, so the only option at that point is deactivating
  (`set-active: false`), which hides it from the catalog but leaves existing purchases downloadable.

### `langmighty-shared` package

An external npm package (not in this repo) that is the single source of truth for `LANGUAGES`,
`INPUT_LANGUAGES`, `DEFAULT_LANGUAGE_KEYS`, `DEFAULT_INPUT_LANGUAGE_KEY`, `matchesScript`, quiz data,
roadmap data, and word-chain data. Both the frontend (`src/App.jsx`, game components) and the backend
(`api/translate.js`) import from it, so language lists and script-validation regexes stay identical on
both sides. Bump its version in `package.json` when it needs new content/keys (see recent commit
history for the pattern) rather than duplicating language config locally.

### Frontend (`src/`)

`App.jsx` is a single-component view switcher (`view` state: `landing | chat | ai-chat | roadmap |
playground | pdf-store`) — there is no router. Conversation state (`conversation`, language prefs,
theme, input language) is persisted to `localStorage` directly in `App.jsx` via small `load*`/effect
pairs; follow that existing pattern rather than introducing a state library.

- `context/AuthGateContext.jsx` — the client-side half of the credit-gate system. Tracks
  `creditsUsed` in `localStorage` purely as a UX shortcut to skip obviously-doomed requests before
  they hit the network; `_lib/creditGate.js` on the server is the actual source of truth.
  `reportServerRejection()` syncs client state when the server 403s (e.g. after `localStorage` was
  cleared) — call it whenever an API response is a 403 with `code: "CREDIT_LIMIT_REACHED"`.
  Signing in is Google OAuth via Supabase (`lib/supabaseClient.js`); a pending marketing-opt-in
  checkbox value is stashed in `localStorage` before the OAuth redirect and applied to the `profiles`
  row on the subsequent `SIGNED_IN` event, since the redirect flow can't carry it directly.
- `lib/apiClient.js` — `apiFetch()` wraps `fetch` to attach the `X-Anon-Id` header everywhere; use it
  instead of raw `fetch` for any `/api/*` call so the credit gate keeps working.
- `components/*Game.jsx` — the six Playground games (Quiz, Word Match, Speed Translate, Listen &
  Guess, Word Chain, Guess the Sentence, Read Aloud). Each pulls from a shared static bank
  (`src/quizData.js`, `src/wordChainData.js`, `src/readAloudData.js`) supplemented by
  `api/game-content.js`, and tracks recently-seen content client-side to avoid repeats until the pool
  cycles.
- `components/Handwritten*` + `utils/imageExport.js` — the "share as handwritten note" image
  generator; paper backgrounds are pure CSS (no image assets) except the photo-background set under
  `src/media/photo-backgrounds/`.
- `utils/pdfExport.js` — PDF export for conversations/chat/roadmap, built on `html2canvas` + `jspdf`;
  page breaks are deliberately placed between messages/turns, not mid-element — preserve that when
  touching export templates (`components/*ExportTemplate.jsx`).
- `components/PdfStoreView.jsx` — the buyer-facing catalog: language filters, Razorpay checkout,
  post-purchase password reveal, and password-gated download. `components/AdminPdfUploadView.jsx` and
  `ManagePdfsView.jsx` are the admin-only upload/manage screens (shown only when `isAdmin`, itself
  derived from the `my-purchases` response) that drive `api/pdf-store/admin.js`'s actions.

### Patches

`patches/edge-tts-universal+1.4.0.patch` (applied via `patch-package` in `postinstall`) fixes the
SSML `xml:lang` to derive from the actual voice instead of hardcoding `en-US`, and fixes a broken
reference to an escape helper. If you bump `edge-tts-universal`, re-verify this patch still applies
and is still needed.

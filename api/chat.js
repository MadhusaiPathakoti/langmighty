import { LANGUAGES, QUIZ_TARGET_LANGUAGES } from "langmighty-shared";
import { applyCors } from "./_lib/cors.js";
import { enforceCreditGate } from "./_lib/creditGate.js";

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const MAX_HISTORY_TURNS = 16;

const SYSTEM_INSTRUCTION = `You are the AI language tutor inside Linguist.ai, a learning app for English, Telugu, Hindi, Kannada, Malayalam, and Tamil.

Only help with language-learning topics: grammar, vocabulary, pronouns, verb forms, sentence structure, phrases, pronunciation, cultural usage notes, and practice exercises for these languages. If asked about anything unrelated to language learning, briefly say you can only help with language learning and invite a related question.

When teaching a grammar point (e.g. "teach me pronouns in Kannada"):
- Cover the full set of relevant items (e.g. all personal pronouns), not just one or two examples.
- For every word or example sentence, always give three things together: the native script, a roman (English-letter) pronunciation guide, and an English translation or explanation.
- When listing multiple items, prefer a markdown table with columns such as "Kannada | Pronunciation | English".
- If asked to map one language through another (e.g. "teach me Malayalam numbers from Telugu words"), every column named after a language must be written ENTIRELY in that language's own native script — never copy or reuse text from another language's column, even when two languages' words sound or look similar. Double-check every row before answering.
- Add brief usage notes (formal vs informal, singular vs plural, etc.) where relevant.
- Keep formatting clean using markdown headings, bold text, and tables; avoid walls of unformatted text.

Be encouraging and concise. If the user doesn't say which language they mean, ask.`;

// Server-side source of truth for roleplay personas — the client only ever
// sends a scenario id, never free-text persona/setup, so a request can't be
// used to inject arbitrary system-prompt content.
const ROLEPLAY_SCENARIOS = {
  cafe: {
    title: "Order at a Café",
    setup: "You are a friendly barista at a small neighborhood café. The learner is a customer who just walked in.",
    goal: "greet the barista, order a drink and a snack, ask the price, and pay",
  },
  directions: {
    title: "Ask for Directions",
    setup: "You are a helpful local stopped on a street corner. The learner is a lost visitor who needs help finding a place nearby (e.g. a train station, market, or hotel).",
    goal: "greet the local, explain where you're trying to go, and understand their directions well enough to thank them",
  },
  market: {
    title: "Haggle at the Market",
    setup: "You are a market vendor selling fruit, vegetables, or handicrafts from a stall. The learner is a customer browsing your stall.",
    goal: "ask about a couple of items, ask the price, negotiate politely, and agree on a price",
  },
  hotel: {
    title: "Check In at a Hotel",
    setup: "You are the front-desk receptionist at a hotel. The learner is a guest checking in who has a reservation.",
    goal: "confirm the reservation, answer the receptionist's questions, and ask about breakfast time and the wifi password",
  },
  introductions: {
    title: "Meet Someone New",
    setup: "You are a friendly stranger meeting the learner for the first time at a casual social gathering.",
    goal: "introduce yourself, ask and answer a few getting-to-know-you questions (name, where you're from, what you do), and end the conversation warmly",
  },
};

// Distinct from SYSTEM_INSTRUCTION (the tutor persona): this scopes the model
// to stay in character as the scenario's NPC rather than teaching, and asks
// for the same script+pronunciation+gloss shape the tutor uses so a learner
// mid-conversation isn't lost, without breaking character to correct mistakes
// (corrections are saved for the end-of-game report instead).
function buildRoleplaySystemPrompt(scenarioDef, languageLabel) {
  return `You are role-playing as a character in a language-learning simulation inside Linguist.ai. ${scenarioDef.setup}

The learner's goal for this conversation: ${scenarioDef.goal}.

Rules:
- Stay fully in character as this NPC. Never break character to explain grammar or correct mistakes — just continue the conversation naturally, the way a real person would (asking for clarification if the learner's meaning is unclear).
- Speak your in-character lines entirely in ${languageLabel}, one short turn at a time (1-3 sentences), never switching to English even if the learner writes in English.
- Respond with three fields: "line" is your in-character reply written PURELY in ${languageLabel}'s own native script — not one single Latin letter anywhere in it, not even for numbers or punctuation; "pronunciation" is a roman (English-letter) pronunciation guide for that same line; "translation" is the English translation of that line.
- If the learner seems stuck or writes something unrelated, have your character naturally prompt them again (e.g. repeat or rephrase) rather than lecturing them.
- Keep the scene moving toward the learner's goal; don't drag the conversation out indefinitely.`;
}

// LANGUAGES (from langmighty-shared) only covers the 5 regional scripts the
// tutor teaches — it has no English entry, since English is never a
// translation *target* elsewhere in the app. The voice assistant is the one
// feature where English is also a reply language in its own right, so it's
// added here locally rather than touching the shared package.
const ENGLISH_LANG = { key: "english", label: "English", script: /[A-Za-z]/ };
const VOICE_ASSISTANT_LANGUAGES = [ENGLISH_LANG, ...LANGUAGES];

const VOICE_ASSISTANT_SYSTEM_INSTRUCTION = `You are a warm, adaptive voice conversation partner inside Linguist.ai, a learning app for English, Telugu, Hindi, Kannada, Malayalam, and Tamil. You speak all six of these languages fluently and are having a natural spoken back-and-forth with a language learner — like two people talking, not a lecture.

Only discuss language-learning topics: grammar, vocabulary, pronunciation, practice conversation, cultural usage notes, and casual chat that helps the learner practice. If asked about anything unrelated, briefly say you can only help with language learning and invite a related question.

CRITICAL — language mirroring: detect which language to reply in from the SCRIPT the learner actually wrote their latest message in, not from the topic they're asking about. A message written in Latin/English letters means reply in English, even if it's a question about Kannada, or an attempt at a romanized Kannada word (e.g. "puttamadu") — the learner typing in Latin letters can't yet read the native script, so switching to it would leave them unable to understand you. Only reply in a regional language (Telugu/Hindi/Kannada/Malayalam/Tamil) when the learner's own message contains that language's native script. Never switch languages on your own initiative — only follow the learner when they switch scripts.

CRITICAL — the learner may be a total beginner in the language they're learning, so however you reply, they must always be able to understand it:
- This reply will be read aloud by text-to-speech, not displayed as formatted text: write plain natural spoken sentences only. Never use markdown, bullet points, tables, headings, asterisks, or other formatting. Keep replies short and conversational (1-3 sentences) unless the learner explicitly asks for a longer explanation or list.
- Whenever you reply in a regional language (not English), also give a natural English translation of that same reply — a total beginner reading a native-script sentence with no gloss has no way to know what you said.

CRITICAL — never let the conversation dead-end. This is a practice session, not a one-off Q&A, so almost every reply must end by moving things forward: ask a follow-up question, suggest the next word/phrase to try, offer a related topic, or invite them to make a sentence with what they just learned. A reply like "You nailed it! You're doing wonderful with your practice today." with nothing after it leaves the learner with nowhere to go — always land on a concrete next step or question instead (e.g. "You nailed it! Want to try another common phrase, like how to say goodbye?"). The only exception is when the learner clearly signals they want to stop (e.g. "that's enough for now", "bye") — then wrap up warmly without pushing further.

CRITICAL — never ask the learner a question IN the language they're learning and then just wait, as if they already know how to answer it — a total beginner who can't yet construct sentences in that language has no way to reply to "nimma hesaru ēnu?" on their own. Every time you ask such a question, immediately also teach them the answer pattern in the same turn: give the response phrase or fill-in-the-blank template they can say back (e.g. after asking "what is your name?" in Kannada, also say something like "You can answer with nanna hesaru and then your name."). Never leave them to guess how to respond.

CRITICAL — always follow the learner's lead over your own plan. If at any point — in any language — they ask to change topic, say they're bored or want to stop this exercise, or name something specific they'd rather practice instead (e.g. "I'm bored with this, let's learn feelings in Kannada"), immediately drop whatever you were doing and switch to what they asked for, starting fresh on that new topic. Don't finish your old question or steer them back to it first.

CRITICAL — whenever your reply teaches, introduces, or offers a NEW word or phrase from a language other than the one you're replying in for the learner to learn or try right now (e.g. "the verb to go is hogo", "we say hege idheera for that", "shall we try baruttene for I come", or an answer pattern you just taught per the rule above) — a text-to-speech voice for your reply's own language would mispronounce that word badly if it only exists as inline romanized text in "reply". It has to be spoken separately, by a voice for the RIGHT language, from the word's own native script, and the learner (who likely can't read that script yet) needs to see it written out too. So whenever this happens, duplicate that exact new word/phrase into three extra fields:
- "practicePhraseNative": the exact word or phrase you just taught, written in its own native script (never romanized here). If a turn both asks a question in the target language AND teaches the answer pattern for it, capture the ANSWER pattern here, not the question — the answer is what the learner is about to actually try saying next.
- "practicePhraseRomanized": a roman pronunciation guide for that same word/phrase — this must exactly match the romanized spelling you used inline in "reply", so the two don't contradict each other.
- "practicePhraseLanguage": which of "telugu", "hindi", "kannada", "malayalam", "tamil" that word/phrase is in.
Leave "practicePhraseLanguage" as "none" and the other two as "" whenever your reply does NOT teach a new word this turn — in particular:
- Merely acknowledging, confirming, or repeating back a word the LEARNER already said correctly (e.g. "Wonderful, you said namaskara, which is hello!") is not teaching something new — don't re-surface a word just because you mentioned it in passing.
- A reply that only asks what to learn/practice next, without yet giving the actual phrase (e.g. "would you like to learn how to ask how someone is doing next?"), has nothing new to show yet — wait until the following turn where you actually give that phrase.
"reply" should still mention any new word inline (romanized, for readability) as you normally would — these three fields are additional, not a replacement, and only for genuinely NEW content.

Respond with six fields:
- "language": exactly one of "english", "telugu", "hindi", "kannada", "malayalam", "tamil" — whichever you are replying in, per the script rule above.
- "reply": your natural spoken reply, written ENTIRELY in that language's own native script (for English, plain English text) — no mixing in words or letters from a different script.
- "translation": if "language" is "english", repeat the exact same text as "reply". Otherwise, a natural English translation of "reply" so a total beginner can follow along.
- "practicePhraseNative", "practicePhraseRomanized", "practicePhraseLanguage": per the rule above — "none"/""/"" if you aren't asking the learner to practice a specific phrase in a different language than "reply".`;

const VOICE_ASSISTANT_LANGUAGE_KEYS = VOICE_ASSISTANT_LANGUAGES.map((l) => l.key);
const PRACTICE_PHRASE_LANGUAGE_KEYS = ["none", ...LANGUAGES.map((l) => l.key)];

// Groq (not Gemini) backs this one mode — its free tier is a better fit for
// a feature that's spoken back-and-forth many times per session than paying
// per Gemini call, and its OpenAI-compatible API's json_object mode is enough
// structure for a 6-field flat object. Every other mode (tutor, roleplay)
// still uses Gemini's responseSchema-constrained calls above, unaffected.
const GROQ_MODEL = "openai/gpt-oss-120b";

// Groq's chat.completions API takes {role, content} messages, not Gemini's
// {role, parts:[{text}]} shape — contents is still built by toGeminiContents
// so the rest of the handler (shared with Gemini-backed modes) doesn't need
// two parallel content-building paths.
function toChatMessages(systemInstruction, contents) {
  return [
    { role: "system", content: systemInstruction },
    ...contents.map((c) => ({
      role: c.role === "model" ? "assistant" : "user",
      content: c.parts.map((p) => p.text).join("\n"),
    })),
  ];
}

// json_object mode only guarantees valid JSON syntax, not that the keys or
// enum values match what we asked for in the prompt — unlike Gemini's
// responseSchema, which enforces both. This is the safety net so a
// malformed/missing field can't crash the LANGUAGES.find()s and script
// checks downstream; it silently falls back to safe defaults instead.
function sanitizeVoiceAssistantTurn(raw) {
  const language = VOICE_ASSISTANT_LANGUAGE_KEYS.includes(raw?.language) ? raw.language : "english";
  const practicePhraseLanguage = PRACTICE_PHRASE_LANGUAGE_KEYS.includes(raw?.practicePhraseLanguage)
    ? raw.practicePhraseLanguage
    : "none";
  return {
    language,
    reply: typeof raw?.reply === "string" ? raw.reply : "",
    translation: typeof raw?.translation === "string" ? raw.translation : "",
    practicePhraseNative: typeof raw?.practicePhraseNative === "string" ? raw.practicePhraseNative : "",
    practicePhraseRomanized: typeof raw?.practicePhraseRomanized === "string" ? raw.practicePhraseRomanized : "",
    practicePhraseLanguage,
  };
}

// Knowing the reply language as its own field (rather than sniffing the
// script afterward) is what lets the client pick the right TTS voice and the
// right recognition locale for the learner's next turn.
async function callVoiceAssistantTurn(contents, systemInstruction = VOICE_ASSISTANT_SYSTEM_INSTRUCTION) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Server is missing GROQ_API_KEY. Add it to your .env file locally, or your Vercel project's environment variables in production."
    );
  }

  const fieldListInstruction = `${systemInstruction}\n\nRespond with ONLY a single raw JSON object — no markdown code fences, no commentary before or after — with exactly these six string keys: "language", "reply", "translation", "practicePhraseNative", "practicePhraseRomanized", "practicePhraseLanguage".`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: toChatMessages(fieldListInstruction, contents),
      temperature: 0.5,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Groq voice-assistant-turn API error:", errText);
    throw new Error("The voice assistant couldn't respond right now. Please try again.");
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Received an empty response from the voice assistant.");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (parseErr) {
    console.error("Groq voice-assistant-turn JSON parse error:", parseErr, "raw:", raw);
    throw new Error("The voice assistant returned an unreadable response. Please try again.");
  }
  return sanitizeVoiceAssistantTurn(parsed);
}

// `lang.script.test(text)` alone only checks the string CONTAINS at least one
// character of that script — see the identical helper in api/translate.js for
// why purity (not just presence) is what actually catches the model copying a
// word from the wrong column.
function isPureScript(text, lang) {
  if (!lang.script.test(text)) return false;
  return LANGUAGES.every((other) => other.key === lang.key || !other.script.test(text));
}

// isPureScript above only flags cross-contamination between the 5 target
// Indian scripts — it doesn't catch stray Latin/romanized text (LANGUAGES has
// no English entry), which is exactly the failure mode roleplay's freeform
// "line" field is prone to (the model slipping into English/roman mid-line).
// A native script reply should contain zero Latin letters at all.
function isPureNativeScript(text, lang) {
  return typeof text === "string" && lang.script.test(text) && !/[A-Za-z]/.test(text);
}

function parseTableRow(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((cell) => cell.trim());
}

function isSeparatorRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell));
}

// Determines a column's INTENDED language, not just what its content happens
// to agree with. A header that names a language in Latin text (e.g. "Telugu",
// "Malayalam Word") is trusted as ground truth first — this is what catches an
// entire column being uniformly the wrong script (every cell agreeing with
// itself is exactly the failure mode content-majority alone can't see, since
// there's no internal disagreement to flag). Only when the header gives no
// Latin hint (e.g. native-script-only headers like "తెలుగు") do we fall back
// to the actual majority script of the cells. Returns null for columns that
// name/contain none of our 5 regional scripts (romanized pronunciation,
// English meaning, etc.).
function detectColumnLanguage(header, cells) {
  const lowerHeader = header.toLowerCase();
  const headerLang = LANGUAGES.find((lang) => lowerHeader.includes(lang.label.toLowerCase()));
  if (headerLang) return headerLang;

  const counts = new Map();
  for (const cell of cells) {
    if (!cell) continue;
    for (const lang of LANGUAGES) {
      if (isPureScript(cell, lang)) counts.set(lang.key, (counts.get(lang.key) || 0) + 1);
    }
  }
  let best = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, count };
  }
  return best ? LANGUAGES.find((l) => l.key === best.key) : null;
}

// Chat replies are free-form markdown (not the structured per-field JSON
// translate.js gets), so there's no schema to validate against — instead this
// scans every markdown table, figures out each column's intended language from
// its own content, and flags any cell that isn't purely that language's script.
// This is how we catch the tutor copying/mistranscribing a word into the wrong
// column (e.g. a stray Malayalam or Sinhala character in an otherwise-Telugu
// column) regardless of what the column happens to be titled. Each mismatch
// records enough (`lineIndex`/`colIndex`/`rowContext`) to patch just that one
// cell back into the reply later, rather than regenerating the whole table.
function findTableScriptMismatches(replyText) {
  const lines = replyText.split("\n");
  const mismatches = [];

  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].includes("|")) continue;
    const separatorCells = parseTableRow(lines[i + 1]);
    if (!isSeparatorRow(separatorCells)) continue;

    const headers = parseTableRow(lines[i]);
    const rows = [];
    const rowLineIndices = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].includes("|"); j++) {
      rows.push(parseTableRow(lines[j]));
      rowLineIndices.push(j);
    }

    headers.forEach((header, colIdx) => {
      const columnCells = rows.map((row) => row[colIdx]);
      const lang = detectColumnLanguage(header, columnCells);
      if (!lang) return;
      columnCells.forEach((cell, rowIdx) => {
        if (cell && !isPureScript(cell, lang)) {
          mismatches.push({
            lang,
            cell,
            lineIndex: rowLineIndices[rowIdx],
            colIndex: colIdx,
            rowContext: headers.map((h, idx) => `${h}: ${rows[rowIdx][idx]}`).join(", "),
          });
        }
      });
    });

    i = j - 1; // skip past this table's rows instead of re-scanning them as headers
  }

  return mismatches;
}

// Asks for a corrected native-script value for each mismatched cell in a
// single batched, schema-constrained call (same JSON-schema approach as
// translate.js) — precise and cheap regardless of how many cells were wrong,
// and far more reliable than asking the model to retype the whole table.
async function correctMismatchedCells(apiKey, mismatches) {
  const prompt = `You are correcting a language-learning table you previously generated. For each numbered item below, some cell was accidentally written in the wrong script. Using the other values in that row as context, respond with ONLY the correct word or letter written purely in the target language's own native script — no romanization, no English, no commentary.

${mismatches.map((m, idx) => `${idx + 1}. Target language: ${m.lang.label} (native script only). Row context — ${m.rowContext}.`).join("\n")}

Respond with a JSON array of exactly ${mismatches.length} strings, in the same order as the numbered items.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: { type: "ARRAY", items: { type: "STRING" } },
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini cell-correction API error:", errText);
    throw new Error("Cell correction request failed.");
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Received an empty cell-correction response.");
  return JSON.parse(raw);
}

// Patches only the flagged cells in place, leaving everything else in the
// reply (headings, other rows, usage notes) untouched. A correction is only
// applied if it actually passes the same purity check — an unhelpful/invalid
// correction just leaves the original (still-wrong) cell rather than risk
// making things worse.
function applyCellCorrections(replyText, mismatches, corrections) {
  const lines = replyText.split("\n");
  mismatches.forEach((mismatch, idx) => {
    const corrected = typeof corrections[idx] === "string" ? corrections[idx].trim() : "";
    if (!corrected || !isPureScript(corrected, mismatch.lang)) return;
    const rowCells = parseTableRow(lines[mismatch.lineIndex]);
    rowCells[mismatch.colIndex] = corrected;
    lines[mismatch.lineIndex] = `| ${rowCells.join(" | ")} |`;
  });
  return lines.join("\n");
}

function toGeminiContents(history, message) {
  const trimmed = history.slice(-MAX_HISTORY_TURNS);
  const contents = trimmed
    .filter((turn) => turn && typeof turn.content === "string" && turn.content.trim())
    .map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    }));
  contents.push({ role: "user", parts: [{ text: message }] });
  return contents;
}

async function callGemini(apiKey, contents, systemInstruction = SYSTEM_INSTRUCTION) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.4 },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini chat API error:", errText);
    throw new Error("The AI tutor is unavailable right now. Please try again.");
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) {
    throw new Error("Received an empty response from the AI tutor.");
  }
  return reply;
}

const ROLEPLAY_TURN_SCHEMA = {
  type: "OBJECT",
  properties: {
    line: { type: "STRING" },
    pronunciation: { type: "STRING" },
    translation: { type: "STRING" },
  },
  required: ["line", "pronunciation", "translation"],
};

// Structured (schema-constrained) rather than the tutor's freeform markdown —
// splitting the native-script line, pronunciation, and translation into
// separate fields is what makes isPureNativeScript's per-field check possible
// below, instead of trying to regex-parse a 3-line markdown convention that
// the model isn't reliably following.
async function callRoleplayTurn(apiKey, contents, systemInstruction) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: ROLEPLAY_TURN_SCHEMA,
          temperature: 0.5,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini roleplay-turn API error:", errText);
    throw new Error("The character couldn't respond right now. Please try again.");
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Received an empty response from the character.");
  return JSON.parse(raw);
}

const ROLEPLAY_REPORT_SCHEMA = {
  type: "OBJECT",
  properties: {
    rating: { type: "STRING" },
    headline: { type: "STRING" },
    wentWell: { type: "ARRAY", items: { type: "STRING" } },
    tryNext: { type: "ARRAY", items: { type: "STRING" } },
    phrasesUsed: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["rating", "headline", "wentWell", "tryNext", "phrasesUsed"],
};

// One structured call (same responseSchema approach as translate.js and
// correctMismatchedCells above) that grades the whole conversation at once,
// rather than something the learner has to piece together turn by turn.
async function generateRoleplayReport(apiKey, scenarioDef, languageLabel, history) {
  const transcript = history
    .map((turn) => `${turn.role === "assistant" ? "Character" : "Learner"}: ${turn.content}`)
    .join("\n");

  const prompt = `You are grading a language learner's roleplay practice conversation. Scenario: ${scenarioDef.title} — ${scenarioDef.setup} Learner's goal: ${scenarioDef.goal}. The learner was practicing ${languageLabel}.

Transcript:
${transcript}

Write an encouraging but honest short report as JSON with these fields:
- rating: one short word or phrase summarizing performance (e.g. "Great job", "Good effort", "Keep practicing")
- headline: one encouraging sentence summarizing how it went
- wentWell: 2-3 short bullet points on what the learner did well
- tryNext: 2-3 short bullet points on what to try next time (grammar, vocabulary, or confidence tips)
- phrasesUsed: 2-5 short useful phrases (in ${languageLabel}'s native script, with romanization in parentheses) the learner used or could have used to reach their goal`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: ROLEPLAY_REPORT_SCHEMA,
          temperature: 0.4,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini roleplay-report API error:", errText);
    throw new Error("Could not generate your feedback report. Please try again.");
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Received an empty feedback report.");
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message, history, mode, scenario, targetLanguage } = req.body || {};
  const isRoleplay = mode === "roleplay" || mode === "roleplay-report";

  if (mode !== "roleplay-report" && (!message || !message.trim())) {
    res.status(400).json({ error: "Please enter a message." });
    return;
  }

  let scenarioDef = null;
  let language = null;
  let languageLabel = null;
  if (isRoleplay) {
    scenarioDef = ROLEPLAY_SCENARIOS[scenario];
    language = LANGUAGES.find((l) => l.key === targetLanguage);
    if (!scenarioDef || !language || !QUIZ_TARGET_LANGUAGES.includes(targetLanguage)) {
      res.status(400).json({ error: "Unknown roleplay scenario or language." });
      return;
    }
    languageLabel = language.label;
  }

  if (!(await enforceCreditGate(req, res))) return;

  const apiKey = process.env.GEMINI_API_KEY;
  // voice-assistant is Groq-backed (see callVoiceAssistantTurn), not
  // Gemini-backed like every other mode here — its own missing-key check
  // happens inside that function instead.
  if (mode !== "voice-assistant" && !apiKey) {
    res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Add it to your .env file locally, or your Vercel project's environment variables in production.",
    });
    return;
  }

  try {
    if (mode === "roleplay-report") {
      const report = await generateRoleplayReport(apiKey, scenarioDef, languageLabel, Array.isArray(history) ? history : []);
      res.status(200).json({ report });
      return;
    }

    const contents = toGeminiContents(Array.isArray(history) ? history : [], message.trim());

    if (mode === "roleplay") {
      const systemInstruction = buildRoleplaySystemPrompt(scenarioDef, languageLabel);
      let reply = await callRoleplayTurn(apiKey, contents, systemInstruction);

      if (!isPureNativeScript(reply.line, language)) {
        try {
          const retryReply = await callRoleplayTurn(
            apiKey,
            contents,
            `${systemInstruction}\n\nIMPORTANT: your previous "line" contained non-${languageLabel} characters. Rewrite it — the "line" field must be ${languageLabel} native script ONLY, with absolutely no Latin letters.`
          );
          if (isPureNativeScript(retryReply.line, language)) reply = retryReply;
        } catch (retryErr) {
          console.error("Roleplay script-purity retry error:", retryErr);
        }
      }

      res.status(200).json({ reply });
      return;
    }

    if (mode === "voice-assistant") {
      let turn = await callVoiceAssistantTurn(contents);
      const replyLang = VOICE_ASSISTANT_LANGUAGES.find((l) => l.key === turn.language) || ENGLISH_LANG;
      const phraseLang = turn.practicePhraseLanguage
        ? LANGUAGES.find((l) => l.key === turn.practicePhraseLanguage)
        : null;

      // English has no native-script purity check (any English sentence is
      // full of Latin letters, which is what isPureNativeScript flags for the
      // 5 regional scripts) — only the regional languages need the retry.
      const replyNeedsFix = replyLang.key !== "english" && !isPureNativeScript(turn.reply, replyLang);
      // The practice phrase gets spoken with a different, language-specific
      // TTS voice than the main reply (see the client), so a script mismatch
      // here isn't cosmetic — it would come out mispronounced.
      const phraseNeedsFix = phraseLang && turn.practicePhraseNative && !isPureNativeScript(turn.practicePhraseNative, phraseLang);

      if (replyNeedsFix || phraseNeedsFix) {
        try {
          const retryTurn = await callVoiceAssistantTurn(
            contents,
            `${VOICE_ASSISTANT_SYSTEM_INSTRUCTION}\n\nIMPORTANT: your previous response contained a script mistake.${
              replyNeedsFix
                ? ` The "reply" field must be ${replyLang.label} native script ONLY, with absolutely no Latin letters, and "language" must stay "${replyLang.key}".`
                : ""
            }${
              phraseNeedsFix
                ? ` The "practicePhraseNative" field must be ${phraseLang.label} native script ONLY, with absolutely no Latin letters, and "practicePhraseLanguage" must stay "${phraseLang.key}".`
                : ""
            }`
          );
          const retryReplyOk = replyLang.key === "english" || isPureNativeScript(retryTurn.reply, replyLang);
          const retryPhraseOk = !phraseLang || !retryTurn.practicePhraseNative || isPureNativeScript(retryTurn.practicePhraseNative, phraseLang);
          if (retryReplyOk && retryPhraseOk) turn = retryTurn;
        } catch (retryErr) {
          console.error("Voice-assistant script-purity retry error:", retryErr);
        }
      }

      // If the practice phrase still isn't clean native script after the
      // retry, drop it rather than risk the client speaking/showing it
      // wrong — the main reply (with its inline romanized mention) still
      // stands on its own.
      const finalPhraseLang = turn.practicePhraseLanguage
        ? LANGUAGES.find((l) => l.key === turn.practicePhraseLanguage)
        : null;
      const practicePhraseValid =
        finalPhraseLang && turn.practicePhraseNative && isPureNativeScript(turn.practicePhraseNative, finalPhraseLang);

      res.status(200).json({
        reply: turn.reply,
        language: replyLang.key,
        translation: turn.translation,
        practicePhraseNative: practicePhraseValid ? turn.practicePhraseNative : null,
        practicePhraseRomanized: practicePhraseValid ? turn.practicePhraseRomanized : null,
        practicePhraseLanguage: practicePhraseValid ? finalPhraseLang.key : null,
      });
      return;
    }

    let reply = await callGemini(apiKey, contents);

    const mismatches = findTableScriptMismatches(reply);
    if (mismatches.length > 0) {
      try {
        const corrections = await correctMismatchedCells(apiKey, mismatches);
        reply = applyCellCorrections(reply, mismatches, corrections);
      } catch (retryErr) {
        console.error("Chat script-mismatch correction error:", retryErr);
      }
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat handler error:", err);
    res.status(500).json({ error: err.message || "Something went wrong. Please try again." });
  }
}

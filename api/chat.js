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
  if (!apiKey) {
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

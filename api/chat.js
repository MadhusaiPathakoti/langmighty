import { LANGUAGES } from "langmighty-shared";
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

// `lang.script.test(text)` alone only checks the string CONTAINS at least one
// character of that script — see the identical helper in api/translate.js for
// why purity (not just presence) is what actually catches the model copying a
// word from the wrong column.
function isPureScript(text, lang) {
  if (!lang.script.test(text)) return false;
  return LANGUAGES.every((other) => other.key === lang.key || !other.script.test(text));
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

async function callGemini(apiKey, contents) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
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

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message, history } = req.body || {};
  if (!message || !message.trim()) {
    res.status(400).json({ error: "Please enter a message." });
    return;
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
    const contents = toGeminiContents(Array.isArray(history) ? history : [], message.trim());
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

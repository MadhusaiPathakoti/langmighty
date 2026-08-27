import { useState } from "react";

// Deterministic, evenly-spaced spread across the document — used as a quick
// starting point so the admin isn't forced to hand-pick every page from
// scratch, while still leaving full manual control as the actual mechanism.
export function evenSpread(pageCount, count) {
  const n = Math.max(1, Math.min(count, pageCount));
  if (n >= pageCount) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (n === 1) return [1];
  const pages = new Set();
  for (let i = 0; i < n; i++) {
    pages.add(1 + Math.round((i * (pageCount - 1)) / (n - 1)));
  }
  return [...pages].sort((a, b) => a - b);
}

// Parses print-dialog-style page range text ("1, 5-8, 12") into a sorted,
// deduplicated, bounds-clamped page list. Silently drops anything malformed
// or out of range rather than rejecting the whole input, since the admin is
// actively typing — a stray comma or in-progress "10-" shouldn't nuke
// everything else they've already entered.
function parsePageRanges(text, pageCount) {
  const pages = new Set();
  for (const part of text.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let [, a, b] = rangeMatch.map(Number);
      if (a > b) [a, b] = [b, a];
      for (let p = Math.max(1, a); p <= Math.min(pageCount, b); p++) pages.add(p);
    } else if (/^\d+$/.test(trimmed)) {
      const p = Number(trimmed);
      if (p >= 1 && p <= pageCount) pages.add(p);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

// Inverse of parsePageRanges — collapses consecutive runs back into ranges
// (e.g. [1, 6, 11, 15, 16] -> "1, 6, 11, 15-16") so re-opening the editor
// shows a compact, editable string rather than every page spelled out.
function formatPageRanges(pages) {
  if (pages.length === 0) return "";
  const sorted = [...pages].sort((a, b) => a - b);
  const parts = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = cur;
    prev = cur;
  }
  return parts.join(", ");
}

export default function PdfPreviewPagePicker({ pageCount, selected, onChange, disabled }) {
  const [draft, setDraft] = useState(formatPageRanges(selected));
  const [autoCount, setAutoCount] = useState(String(Math.min(3, pageCount)));

  // The text field is uncontrolled-ish on purpose (its own `draft` state, not
  // fed live from `selected`) — parsing on every keystroke would fight the
  // admin mid-edit (e.g. typing "10-" only to have it vanish). It only
  // re-syncs to match `selected` after a change that happened OUTSIDE the
  // field itself (a chip removal, Auto-spread, Clear).
  function applyDraft() {
    const parsed = parsePageRanges(draft, pageCount);
    onChange(parsed);
    setDraft(formatPageRanges(parsed));
  }

  function removePage(page) {
    const next = selected.filter((p) => p !== page);
    onChange(next);
    setDraft(formatPageRanges(next));
  }

  function applyAutoSpread() {
    const next = evenSpread(pageCount, Number(autoCount) || 1);
    onChange(next);
    setDraft(formatPageRanges(next));
  }

  function clearAll() {
    onChange([]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="text-sm text-gray-600 dark:text-gray-300">
          Pages to include ({pageCount} page{pageCount === 1 ? "" : "s"} total)
        </label>
        <span className="text-xs text-gray-400 dark:text-gray-500">{selected.length} selected</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={applyDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyDraft();
            }
          }}
          placeholder="e.g. 1, 5-8, 12"
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-1.5 text-sm disabled:opacity-60"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={applyDraft}
          className="rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
        >
          Apply
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        Comma-separated page numbers and ranges, e.g. "1, 5-8, 12".
      </p>

      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Or auto-spread</span>
        <input
          type="number"
          min="1"
          max={pageCount}
          value={autoCount}
          disabled={disabled}
          onChange={(e) => setAutoCount(e.target.value)}
          className="w-14 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 text-xs disabled:opacity-60"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">pages evenly</span>
        <button
          type="button"
          disabled={disabled}
          onClick={applyAutoSpread}
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Apply
        </button>
        <button
          type="button"
          disabled={disabled || selected.length === 0}
          onClick={clearAll}
          className="ml-auto text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 max-h-32 overflow-y-auto">
          {selected.map((page) => (
            <span
              key={page}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-medium pl-2.5 pr-1.5 py-1"
            >
              Page {page}
              <button
                type="button"
                disabled={disabled}
                onClick={() => removePage(page)}
                title={`Remove page ${page}`}
                className="rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 w-4 h-4 flex items-center justify-center disabled:opacity-60"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

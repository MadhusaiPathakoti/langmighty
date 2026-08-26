import { useState } from "react";

// Deterministic, evenly-spaced spread across the document — used as a quick
// starting point so the admin isn't forced to hand-pick every page from
// scratch, while still leaving full manual control (toggle any page) as the
// actual mechanism.
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

export default function PdfPreviewPagePicker({ pageCount, selected, onChange, disabled }) {
  const [autoCount, setAutoCount] = useState(String(Math.min(3, pageCount)));

  function togglePage(page) {
    if (disabled) return;
    onChange(selected.includes(page) ? selected.filter((p) => p !== page) : [...selected, page].sort((a, b) => a - b));
  }

  function applyAutoSpread() {
    onChange(evenSpread(pageCount, Number(autoCount) || 1));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {selected.length} of {pageCount} page{pageCount === 1 ? "" : "s"} selected for the free preview
        </p>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="1"
            max={pageCount}
            value={autoCount}
            disabled={disabled}
            onChange={(e) => setAutoCount(e.target.value)}
            className="w-14 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 text-xs disabled:opacity-60"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={applyAutoSpread}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Auto-spread
          </button>
          <button
            type="button"
            disabled={disabled || selected.length === 0}
            onClick={() => onChange([])}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 p-2">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => {
          const isSelected = selected.includes(page);
          return (
            <button
              key={page}
              type="button"
              disabled={disabled}
              onClick={() => togglePage(page)}
              title={isSelected ? `Remove page ${page} from preview` : `Add page ${page} to preview`}
              className={`rounded-lg text-xs font-medium py-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                isSelected
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>
    </div>
  );
}

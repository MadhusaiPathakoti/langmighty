import { useEffect, useRef, useState } from "react";
import { QUIZ_CATEGORIES } from "langmighty-shared";

const ALL_CATEGORY_KEYS = QUIZ_CATEGORIES.map((c) => c.key);

export default function TopicPicker({ selected, onToggle, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const summary =
    selected.length === ALL_CATEGORY_KEYS.length
      ? "All topics"
      : selected.length === 1
        ? QUIZ_CATEGORIES.find((c) => c.key === selected[0])?.label
        : `${selected.length} topics`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={open}
        className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5 text-sm disabled:opacity-50"
      >
        {summary} ▾
      </button>

      {open && !disabled && (
        <div className="absolute left-0 mt-1 w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-2 px-3 z-20">
          {QUIZ_CATEGORIES.map((cat) => {
            const checked = selected.includes(cat.key);
            const isOnlyOne = checked && selected.length === 1;
            return (
              <label
                key={cat.key}
                className={`flex items-center gap-2 py-1 text-sm ${
                  isOnlyOne ? "cursor-not-allowed text-gray-400" : "cursor-pointer text-gray-700 dark:text-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isOnlyOne}
                  onChange={() => onToggle(cat.key)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {cat.label}
              </label>
            );
          })}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">At least one topic must stay selected.</p>
        </div>
      )}
    </div>
  );
}

export function loadQuizCategories(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((k) => ALL_CATEGORY_KEYS.includes(k))) {
      return parsed;
    }
  } catch {
    // fall through to default
  }
  return ALL_CATEGORY_KEYS;
}

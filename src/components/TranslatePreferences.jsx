import { useEffect, useRef, useState } from "react";
import { INPUT_LANGUAGES, LANGUAGES } from "langmighty-shared";

export default function TranslatePreferences({ inputLanguage, onChangeInputLanguage, selectedLanguages, onToggleLanguage }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const outputOptions = LANGUAGES.filter((lang) => lang.key !== inputLanguage);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200
                   dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        ⚙ Preferences ▾
      </button>

      {open && (
        // Opens upward (bottom-full) since this lives in the footer, right above
        // the input — opening downward like the nav dropdowns did would push it
        // off the bottom of the screen.
        <div
          className="absolute right-0 bottom-full mb-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-900 shadow-lg py-2 px-3 z-20"
        >
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">I'll type in</p>
          {INPUT_LANGUAGES.map((lang) => (
            <label
              key={lang.key}
              className="flex items-center gap-2 py-1 text-sm cursor-pointer text-gray-700 dark:text-gray-200"
            >
              <input
                type="radio"
                name="input-language"
                checked={inputLanguage === lang.key}
                onChange={() => onChangeInputLanguage(lang.key)}
                className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {lang.label}
              {lang.key !== "english" && <span className="text-gray-400">({lang.nativeName})</span>}
            </label>
          ))}

          <div className="my-2 border-t border-gray-100 dark:border-gray-800" />

          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Translate to</p>
          {outputOptions.map((lang) => {
            const checked = selectedLanguages.includes(lang.key);
            const isOnlyOne = checked && selectedLanguages.length === 1;
            return (
              <label
                key={lang.key}
                className={`flex items-center gap-2 py-1 text-sm ${
                  isOnlyOne ? "cursor-not-allowed text-gray-400" : "cursor-pointer text-gray-700 dark:text-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isOnlyOne}
                  onChange={() => onToggleLanguage(lang.key)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {lang.label}
              </label>
            );
          })}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">At least one language must stay selected.</p>
        </div>
      )}
    </div>
  );
}

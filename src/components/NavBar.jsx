import { useEffect, useRef, useState } from "react";
import { ROADMAP_LANGUAGES } from "../roadmapData.js";
import { INPUT_LANGUAGES, LANGUAGES } from "../languages.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";
import IndiaFlagIcon from "./IndiaFlagIcon.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function NavBar({
  view,
  roadmapLanguage,
  onNavigateChat,
  onNavigateAiChat,
  onNavigateRoadmap,
  onNavigatePlayground,
  theme,
  onToggleTheme,
  inputLanguage,
  onChangeInputLanguage,
  selectedLanguages,
  onToggleLanguage,
}) {
  const { isSignedIn, userEmail, remainingCredits, signOut } = useAuthGate();
  const outputOptions = LANGUAGES.filter((lang) => lang.key !== inputLanguage);
  const [roadmapMenuOpen, setRoadmapMenuOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const roadmapMenuRef = useRef(null);
  const prefsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (roadmapMenuRef.current && !roadmapMenuRef.current.contains(e.target)) {
        setRoadmapMenuOpen(false);
      }
      if (prefsRef.current && !prefsRef.current.contains(e.target)) {
        setPrefsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectRoadmapLanguage(langKey) {
    onNavigateRoadmap(langKey);
    setRoadmapMenuOpen(false);
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-y-2 px-4 sm:px-6 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm shadow-sm sticky top-0 z-30">
      <button type="button" onClick={onNavigateChat} className="flex items-center gap-2 group">
        <span className="w-9 h-6 rounded-md overflow-hidden shadow-sm ring-1 ring-black/10 dark:ring-white/10 group-hover:scale-105 transition-transform">
          <IndiaFlagIcon className="w-full h-full" />
        </span>
        <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          LangMighty
        </span>
      </button>

      <div className="flex items-center gap-1 flex-wrap justify-end">
        <button
          type="button"
          onClick={onNavigateChat}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === "chat"
              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          Translate
        </button>

        <button
          type="button"
          onClick={onNavigateAiChat}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === "ai-chat"
              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          AI Chat
        </button>

        <button
          type="button"
          onClick={onNavigatePlayground}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === "playground"
              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          Playground
        </button>

        <div className="relative" ref={roadmapMenuRef}>
          <button
            type="button"
            onClick={() => setRoadmapMenuOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={roadmapMenuOpen}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "roadmap"
                ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Roadmap ▾
          </button>

          {roadmapMenuOpen && (
            <div
              className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 shadow-lg py-1 z-20"
            >
              {ROADMAP_LANGUAGES.map((lang) => (
                <button
                  key={lang.key}
                  type="button"
                  onClick={() => selectRoadmapLanguage(lang.key)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    view === "roadmap" && roadmapLanguage === lang.key
                      ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {lang.label} <span className="text-gray-400">({lang.nativeName})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={prefsRef}>
          <button
            type="button"
            onClick={() => setPrefsOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={prefsOpen}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Preferences ▾
          </button>

          {prefsOpen && (
            <div
              className="absolute right-0 mt-1 w-64 rounded-lg border border-gray-200 dark:border-gray-700
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

              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Translate to
              </p>
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

        {isSignedIn ? (
          <button
            type="button"
            onClick={signOut}
            title={userEmail}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Sign out
          </button>
        ) : (
          <span className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
            {remainingCredits} free {remainingCredits === 1 ? "prompt" : "prompts"} left
          </span>
        )}

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </nav>
  );
}

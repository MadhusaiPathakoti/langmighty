import { useEffect, useRef, useState } from "react";
import { ROADMAP_LANGUAGES } from "../roadmapData.js";
import ThemeToggle from "./ThemeToggle.jsx";

export default function NavBar({ view, roadmapLanguage, onNavigateChat, onNavigateRoadmap, theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectLanguage(langKey) {
    onNavigateRoadmap(langKey);
    setMenuOpen(false);
  }

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <button
        type="button"
        onClick={onNavigateChat}
        className="font-bold text-lg text-gray-900 dark:text-gray-100"
      >
        LangLearn AI
      </button>

      <div className="flex items-center gap-1">
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

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "roadmap"
                ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Roadmap ▾
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 shadow-lg py-1 z-20"
            >
              {ROADMAP_LANGUAGES.map((lang) => (
                <button
                  key={lang.key}
                  type="button"
                  onClick={() => selectLanguage(lang.key)}
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

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </nav>
  );
}

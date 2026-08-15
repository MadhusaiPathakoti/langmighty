import { useEffect, useRef, useState } from "react";
import { ROADMAP_LANGUAGES } from "langmighty-shared";
import { useAuthGate } from "../context/AuthGateContext.jsx";
import ChangePasswordModal from "./ChangePasswordModal.jsx";
import LmLogo from "./LmLogo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function NavBar({
  view,
  roadmapLanguage,
  onNavigateLanding,
  onNavigateChat,
  onNavigateAiChat,
  onNavigateRoadmap,
  onNavigatePlayground,
  onNavigatePdfStore,
  theme,
  onToggleTheme,
}) {
  const { isSignedIn, userEmail, remainingCredits, signOut, openAuthModal } = useAuthGate();
  const [roadmapMenuOpen, setRoadmapMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const roadmapMenuRef = useRef(null);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (roadmapMenuRef.current && !roadmapMenuRef.current.contains(e.target)) {
        setRoadmapMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
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
    <nav className="flex flex-wrap items-center justify-between gap-y-2 px-4 sm:px-6 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm shadow-sm sticky top-0 z-30">
      <button type="button" onClick={onNavigateLanding} className="flex items-center gap-2 group">
        <LmLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
        <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          LangMighty
        </span>
      </button>

      <div className="flex items-center gap-1 flex-wrap justify-end">
        <button
          type="button"
          onClick={onNavigateLanding}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Home
        </button>

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

        <button
          type="button"
          onClick={onNavigatePdfStore}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === "pdf-store"
              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          PDF Store
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

        {isSignedIn ? (
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setAccountMenuOpen((o) => !o)}
              title={userEmail}
              aria-haspopup="true"
              aria-expanded={accountMenuOpen}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {userEmail} ▾
            </button>

            {accountMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 shadow-lg py-1 z-20"
              >
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    setChangePasswordOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Change password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
              {remainingCredits} free {remainingCredits === 1 ? "prompt" : "prompts"} left
            </span>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Sign in
            </button>
          </>
        )}

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </nav>
  );
}

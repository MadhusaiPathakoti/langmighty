import { useEffect, useRef, useState } from "react";
import { ROADMAP_LANGUAGES } from "langmighty-shared";
import { useAuthGate } from "../context/AuthGateContext.jsx";
import ChangePasswordModal from "./ChangePasswordModal.jsx";
import LmLogo from "./LmLogo.jsx";
import StreakBadge from "./StreakBadge.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function NavBar({
  view,
  roadmapLanguage,
  onNavigateLanding,
  onNavigateChat,
  onNavigateAiChat,
  onNavigateVoiceAssistant,
  onNavigateRoadmap,
  onNavigatePlayground,
  onNavigatePdfStore,
  onNavigateSubscribe,
  onOpenContactAdmin,
  theme,
  onToggleTheme,
}) {
  const { isSignedIn, userEmail, tier, signOut, openAuthModal } = useAuthGate();
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
    <nav className="flex flex-wrap items-center gap-y-2 px-4 sm:px-6 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm shadow-sm sticky top-0 z-30">
      {/* Brand — row 1 on mobile, far left on desktop (sm:mr-auto pushes
          everything else into one clustered group on the right, matching
          the original single-row desktop layout). */}
      <div className="flex items-center gap-3 sm:mr-auto">
        <button type="button" onClick={onNavigateLanding} className="flex items-center gap-2 group">
          <LmLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
          <span className="hidden sm:inline font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            LangMighty
          </span>
        </button>
        <StreakBadge />
      </div>

      {/* Account/utility controls — still row 1 on mobile (pushed to the
          right edge via ml-auto), tail end of the single desktop row. */}
      <div className="flex items-center gap-1 flex-wrap justify-end order-2 sm:order-3 ml-auto sm:ml-0">
        {isSignedIn ? (
          <div
            className="relative"
            ref={accountMenuRef}
            onMouseEnter={() => setAccountMenuOpen(true)}
            onMouseLeave={() => setAccountMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setAccountMenuOpen((o) => !o)}
              title={
                tier === "pro" || tier === "premium"
                  ? `${userEmail} — Mighty ${tier === "premium" ? "Premium" : "Pro"}`
                  : userEmail
              }
              aria-haspopup="true"
              aria-expanded={accountMenuOpen}
              aria-label="Account menu"
              className={`relative w-8 h-8 rounded-full text-white text-sm font-semibold
                         flex items-center justify-center transition-colors ${
                           tier === "premium"
                             ? "bg-gradient-to-br from-amber-400 to-amber-600 ring-2 ring-amber-300 dark:ring-amber-500"
                             : tier === "pro"
                               ? "bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-indigo-300 dark:ring-indigo-500"
                               : "bg-indigo-600 hover:bg-indigo-700"
                         }`}
            >
              {userEmail?.charAt(0).toUpperCase() || "?"}
              {(tier === "pro" || tier === "premium") && (
                <span
                  className="absolute -top-1.5 -right-1.5 text-xs leading-none rounded-full bg-white dark:bg-gray-900 w-4 h-4 flex items-center justify-center shadow"
                  aria-hidden="true"
                >
                  {tier === "premium" ? "👑" : "⭐"}
                </span>
              )}
            </button>

            {accountMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-56 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 shadow-lg py-1 z-20"
              >
                <p
                  className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 truncate border-b border-gray-100 dark:border-gray-800"
                  title={userEmail}
                >
                  {userEmail}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onNavigateSubscribe();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Plans & billing
                </button>
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
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("signup")}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              Create account
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onOpenContactAdmin}
          title="Contact Admin"
          aria-label="Contact Admin"
          className="px-2.5 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          🛟
        </button>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {/* Primary nav links — row 2 on mobile, a single horizontally
          scrollable strip (w-full forces the wrap onto its own row; the
          scrolling container is why Roadmap gets a plain non-dropdown
          button below instead of reusing the desktop popup, which would
          get clipped by overflow-x-auto's implied overflow-y: auto). Inline
          with everything else on desktop, matching the original layout. */}
      <div
        className="order-3 sm:order-2 w-full sm:w-auto flex items-center gap-1 overflow-x-auto sm:overflow-visible
                   flex-nowrap sm:flex-wrap -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        <button
          type="button"
          onClick={onNavigateLanding}
          className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Home
        </button>

        <button
          type="button"
          onClick={onNavigateChat}
          className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
          className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === "ai-chat"
              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          AI Chat
        </button>

        <button
          type="button"
          onClick={onNavigateVoiceAssistant}
          className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === "voice-assistant"
              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          Voice Chat
        </button>

        <button
          type="button"
          onClick={onNavigatePlayground}
          className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
          className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === "pdf-store"
              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          PDF Store
        </button>

        {/* Mobile: plain nav item, no language dropdown (see comment above) */}
        <button
          type="button"
          onClick={() => onNavigateRoadmap(roadmapLanguage)}
          className={`sm:hidden flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === "roadmap"
              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          Roadmap
        </button>

        {/* Desktop: full dropdown with per-language shortcuts */}
        <div className="hidden sm:block relative" ref={roadmapMenuRef}>
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
      </div>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </nav>
  );
}

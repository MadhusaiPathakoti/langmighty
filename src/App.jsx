import { useEffect, useRef, useState } from "react";
import AiChatView from "./components/AiChatView.jsx";
import { apiFetch } from "./lib/apiClient.js";
import ChatInput from "./components/ChatInput.jsx";
import ChatTurn from "./components/ChatTurn.jsx";
import CulturalBackground from "./components/CulturalBackground.jsx";
import ExportTemplate from "./components/ExportTemplate.jsx";
import LmLogo from "./components/LmLogo.jsx";
import LandingPage from "./components/landing/LandingPage.jsx";
import NavBar from "./components/NavBar.jsx";
import PlaygroundView from "./components/PlaygroundView.jsx";
import RoadmapView from "./components/RoadmapView.jsx";
import SignupGateModal from "./components/SignupGateModal.jsx";
import TranslatePreferences from "./components/TranslatePreferences.jsx";
import TypewriterText from "./components/TypewriterText.jsx";
import { useAuthGate } from "./context/AuthGateContext.jsx";
import { exportNodeToPdf } from "./utils/pdfExport.js";
import {
  DEFAULT_LANGUAGE_KEYS,
  DEFAULT_INPUT_LANGUAGE_KEY,
  INPUT_LANGUAGES,
  LANGUAGES,
  matchesScript,
} from "langmighty-shared";

const TAGLINES = [
  "Translate between English, Telugu, Hindi, Kannada, Malayalam & Tamil — any language to any language, with pronunciation and voice.",
  "Learn to read, write, and speak Indian languages.",
  "Type in English. Hear it back instantly.",
];

const CONVERSATION_KEY = "langlearn_conversation";
const THEME_KEY = "langlearn_theme";
const LANGUAGE_PREFS_KEY = "langlearn_language_prefs";
const INPUT_LANGUAGE_KEY = "langlearn_input_language";

function loadConversation() {
  try {
    const raw = localStorage.getItem(CONVERSATION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function loadLanguagePrefs() {
  try {
    const raw = localStorage.getItem(LANGUAGE_PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fall through to default
  }
  return DEFAULT_LANGUAGE_KEYS;
}

function loadInputLanguage() {
  const saved = localStorage.getItem(INPUT_LANGUAGE_KEY);
  if (saved && INPUT_LANGUAGES.some((l) => l.key === saved)) return saved;
  return DEFAULT_INPUT_LANGUAGE_KEY;
}

// A language can't be translated into itself: strip the input language out of the
// output selection, falling back to the first other available language if that
// would otherwise leave no output languages selected.
function ensureValidOutputs(outputKeys, inputKey) {
  const filtered = outputKeys.filter((k) => k !== inputKey);
  if (filtered.length > 0) return filtered;
  const fallback = LANGUAGES.find((l) => l.key !== inputKey);
  return fallback ? [fallback.key] : [];
}

let turnCounter = 0;
function nextTurnId() {
  turnCounter += 1;
  return `turn-${Date.now()}-${turnCounter}`;
}

export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "chat" | "ai-chat" | "roadmap" | "playground"
  const [roadmapLanguage, setRoadmapLanguage] = useState("kannada");
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState(loadConversation);
  const [theme, setTheme] = useState(loadTheme);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputLanguage, setInputLanguage] = useState(loadInputLanguage);
  const [selectedLanguages, setSelectedLanguages] = useState(() =>
    ensureValidOutputs(loadLanguagePrefs(), loadInputLanguage())
  );
  const [inputError, setInputError] = useState(null);
  const { requestAccess, consumeCredit, reportServerRejection, getAuthHeaders } = useAuthGate();

  const exportRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(CONVERSATION_KEY, JSON.stringify(conversation));
  }, [conversation]);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_PREFS_KEY, JSON.stringify(selectedLanguages));
  }, [selectedLanguages]);

  useEffect(() => {
    localStorage.setItem(INPUT_LANGUAGE_KEY, inputLanguage);
  }, [inputLanguage]);

  useEffect(() => {
    if (view === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, view]);

  // Shared by handleSubmit (new turn) and handleRegenerate (existing turn) — the
  // caller is responsible for the requestAccess() check and putting the turn into
  // "loading" state before calling this.
  async function runTranslate(turnId, { text, sourceLanguage, languages, regenerate }) {
    setIsSubmitting(true);
    consumeCredit();

    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ text, sourceLanguage, languages, regenerate }),
      });

      if (res.status === 403) {
        reportServerRejection();
        setConversation((prev) =>
          regenerate
            ? prev.map((t) =>
                t.id === turnId
                  ? { ...t, status: "error", error: "You've used your free prompts. Please sign in to continue." }
                  : t
              )
            : prev.filter((t) => t.id !== turnId)
        );
        return;
      }

      const data = await res.json();

      setConversation((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? res.ok
              ? { ...t, status: "done", results: data, error: null }
              : { ...t, status: "error", error: data.error || "Translation failed. Please try again." }
            : t
        )
      );
    } catch {
      setConversation((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? {
                ...t,
                status: "error",
                error: "Could not reach the translation service. Check your connection and try again.",
              }
            : t
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit() {
    const text = inputText.trim();
    if (!text || isSubmitting) return;
    if (!requestAccess()) return;

    const inputLang = INPUT_LANGUAGES.find((l) => l.key === inputLanguage);
    if (!matchesScript(text, inputLanguage)) {
      setInputError(
        inputLang.key === "english"
          ? "Please type in English (Latin script)."
          : `Please type in ${inputLang.label} script (${inputLang.nativeName}).`
      );
      return;
    }
    setInputError(null);

    const turnId = nextTurnId();
    setConversation((prev) => [
      ...prev,
      {
        id: turnId,
        englishText: text,
        sourceText: text,
        sourceLanguage: inputLanguage,
        languages: selectedLanguages,
        status: "loading",
        results: null,
        error: null,
      },
    ]);
    setInputText("");

    await runTranslate(turnId, { text, sourceLanguage: inputLanguage, languages: selectedLanguages, regenerate: false });
  }

  async function handleRegenerate(turnId) {
    if (isSubmitting) return;
    const turn = conversation.find((t) => t.id === turnId);
    if (!turn) return;
    if (!requestAccess()) return;

    setConversation((prev) => prev.map((t) => (t.id === turnId ? { ...t, status: "loading", error: null } : t)));

    await runTranslate(turnId, {
      text: turn.sourceText,
      sourceLanguage: turn.sourceLanguage,
      languages: turn.languages ?? selectedLanguages,
      regenerate: true,
    });
  }

  async function handleExport() {
    if (!exportRef.current) return;
    await exportNodeToPdf(exportRef.current, `translation_${Date.now()}.pdf`);
  }

  function handleDeleteTurn(id) {
    setConversation((prev) => prev.filter((t) => t.id !== id));
  }

  function handleNavigateRoadmap(langKey) {
    setRoadmapLanguage(langKey);
    setView("roadmap");
  }

  function handleToggleLanguage(key) {
    setSelectedLanguages((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  }

  function handleChangeInputLanguage(key) {
    setInputLanguage(key);
    setSelectedLanguages((prev) => ensureValidOutputs(prev, key));
    setInputError(null);
  }

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  const hasContent = conversation.some((t) => t.status === "done");

  if (view === "landing") {
    return <LandingPage onGetStarted={() => setView("chat")} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <CulturalBackground />
      <NavBar
        view={view}
        roadmapLanguage={roadmapLanguage}
        onNavigateLanding={() => setView("landing")}
        onNavigateChat={() => setView("chat")}
        onNavigateAiChat={() => setView("ai-chat")}
        onNavigateRoadmap={handleNavigateRoadmap}
        onNavigatePlayground={() => setView("playground")}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {view === "roadmap" ? (
        <RoadmapView language={roadmapLanguage} onSelectLanguage={setRoadmapLanguage} />
      ) : view === "ai-chat" ? (
        <AiChatView />
      ) : view === "playground" ? (
        <PlaygroundView />
      ) : (
        <>
          <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {conversation.length === 0 ? (
                <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950 px-6 py-14 sm:py-20 text-center">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-purple-200/40 dark:bg-purple-500/10 blur-3xl"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-indigo-200/40 dark:bg-indigo-500/10 blur-3xl"
                  />

                  <LmLogo className="relative w-20 h-20 mx-auto mb-5 drop-shadow-lg" />

                  <TypewriterText
                    phrases={TAGLINES}
                    className="relative block text-xl sm:text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent max-w-xl mx-auto"
                  />

                  <p className="relative mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Type a sentence in{" "}
                    {INPUT_LANGUAGES.find((l) => l.key === inputLanguage)?.label} below to get started.
                  </p>

                  <span className="relative inline-flex items-center gap-1.5 mt-6 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-500 dark:text-gray-400 shadow-sm">
                    ✦ Created by{" "}
                    <a
                      href="https://in.linkedin.com/in/madhusai-pathakoti"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Madhusai Pathakoti
                    </a>
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <TypewriterText phrases={TAGLINES} className="text-gray-500 dark:text-gray-400 text-sm" />
                    <p className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">
                      Created by{" "}
                      <a
                        href="https://in.linkedin.com/in/madhusai-pathakoti"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-500 dark:hover:text-indigo-400 hover:underline"
                      >
                        Madhusai Pathakoti
                      </a>
                    </p>
                  </div>
                  {hasContent && (
                    <button
                      type="button"
                      onClick={handleExport}
                      className="self-start sm:self-auto rounded-lg border border-indigo-600 text-indigo-600
                                 dark:text-indigo-400 dark:border-indigo-400 font-medium px-3 py-2 text-sm
                                 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                    >
                      Export to PDF
                    </button>
                  )}
                </div>
              )}

              {conversation.map((turn) => (
                <ChatTurn
                  key={turn.id}
                  turn={turn}
                  onDelete={handleDeleteTurn}
                  onRegenerate={handleRegenerate}
                  disableActions={isSubmitting}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm px-4 sm:px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="max-w-3xl mx-auto w-full flex justify-end mb-2">
              <TranslatePreferences
                inputLanguage={inputLanguage}
                onChangeInputLanguage={handleChangeInputLanguage}
                selectedLanguages={selectedLanguages}
                onToggleLanguage={handleToggleLanguage}
              />
            </div>
            <ChatInput
              value={inputText}
              onChange={(v) => {
                setInputText(v);
                if (inputError) setInputError(null);
              }}
              onSubmit={handleSubmit}
              loading={isSubmitting}
              inputLanguage={inputLanguage}
              error={inputError}
            />
          </footer>

          {hasContent && <ExportTemplate ref={exportRef} conversation={conversation} />}
        </>
      )}

      <SignupGateModal />
    </div>
  );
}

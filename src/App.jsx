import { useEffect, useRef, useState } from "react";
import ChatInput from "./components/ChatInput.jsx";
import ChatTurn from "./components/ChatTurn.jsx";
import CulturalBackground from "./components/CulturalBackground.jsx";
import ExportTemplate from "./components/ExportTemplate.jsx";
import IndiaFlagIcon from "./components/IndiaFlagIcon.jsx";
import NavBar from "./components/NavBar.jsx";
import RoadmapView from "./components/RoadmapView.jsx";
import TypewriterText from "./components/TypewriterText.jsx";
import { exportNodeToPdf } from "./utils/pdfExport.js";
import { DEFAULT_LANGUAGE_KEYS } from "./languages.js";

const TAGLINES = [
  "English to Telugu, Hindi, Kannada, Malayalam & Tamil — with pronunciation and voice.",
  "Learn to read, write, and speak Indian languages.",
  "Type in English. Hear it back instantly.",
];

const CONVERSATION_KEY = "langlearn_conversation";
const THEME_KEY = "langlearn_theme";
const LANGUAGE_PREFS_KEY = "langlearn_language_prefs";

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

let turnCounter = 0;
function nextTurnId() {
  turnCounter += 1;
  return `turn-${Date.now()}-${turnCounter}`;
}

export default function App() {
  const [view, setView] = useState("chat"); // "chat" | "roadmap"
  const [roadmapLanguage, setRoadmapLanguage] = useState("kannada");
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState(loadConversation);
  const [theme, setTheme] = useState(loadTheme);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState(loadLanguagePrefs);

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
    if (view === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, view]);

  async function handleSubmit() {
    const text = inputText.trim();
    if (!text || isSubmitting) return;

    const turnId = nextTurnId();
    setConversation((prev) => [
      ...prev,
      { id: turnId, englishText: text, status: "loading", results: null, error: null },
    ]);
    setInputText("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, languages: selectedLanguages }),
      });
      const data = await res.json();

      setConversation((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? res.ok
              ? { ...t, status: "done", results: data }
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

  async function handleExport() {
    if (!exportRef.current) return;
    await exportNodeToPdf(exportRef.current, `translation_${Date.now()}.pdf`);
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

  const hasContent = conversation.some((t) => t.status === "done");

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <CulturalBackground />
      <NavBar
        view={view}
        roadmapLanguage={roadmapLanguage}
        selectedLanguages={selectedLanguages}
        onToggleLanguage={handleToggleLanguage}
        onNavigateChat={() => setView("chat")}
        onNavigateRoadmap={handleNavigateRoadmap}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />

      {view === "roadmap" ? (
        <RoadmapView language={roadmapLanguage} onSelectLanguage={setRoadmapLanguage} />
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

                  <div className="relative w-20 h-14 mx-auto mb-5 rounded-2xl overflow-hidden shadow-lg shadow-black/10 ring-1 ring-black/10 dark:ring-white/10">
                    <IndiaFlagIcon className="w-full h-full" />
                  </div>

                  <TypewriterText
                    phrases={TAGLINES}
                    className="relative block text-xl sm:text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent max-w-xl mx-auto"
                  />

                  <p className="relative mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Type an English sentence below to get started.
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
                <ChatTurn key={turn.id} turn={turn} />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm px-4 sm:px-6 py-4">
            <ChatInput value={inputText} onChange={setInputText} onSubmit={handleSubmit} loading={isSubmitting} />
          </footer>

          {hasContent && <ExportTemplate ref={exportRef} conversation={conversation} />}
        </>
      )}
    </div>
  );
}

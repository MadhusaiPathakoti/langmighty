import { useEffect, useRef, useState } from "react";
import ChatInput from "./components/ChatInput.jsx";
import ChatTurn from "./components/ChatTurn.jsx";
import ExportTemplate from "./components/ExportTemplate.jsx";
import NavBar from "./components/NavBar.jsx";
import RoadmapView from "./components/RoadmapView.jsx";
import { exportNodeToPdf } from "./utils/pdfExport.js";

const CONVERSATION_KEY = "langlearn_conversation";
const THEME_KEY = "langlearn_theme";

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
        body: JSON.stringify({ text }),
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

  const hasContent = conversation.some((t) => t.status === "done");

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <NavBar
        view={view}
        roadmapLanguage={roadmapLanguage}
        onNavigateChat={() => setView("chat")}
        onNavigateRoadmap={handleNavigateRoadmap}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />

      {view === "roadmap" ? (
        <RoadmapView language={roadmapLanguage} onSelectLanguage={setRoadmapLanguage} />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  English to Kannada, Malayalam &amp; Tamil — with pronunciation and voice.
                </p>
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

              {conversation.length === 0 && (
                <p className="text-center text-gray-400 dark:text-gray-500 mt-16">
                  Type an English sentence below to get started.
                </p>
              )}
              {conversation.map((turn) => (
                <ChatTurn key={turn.id} turn={turn} />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <footer className="border-t border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
            <ChatInput value={inputText} onChange={setInputText} onSubmit={handleSubmit} loading={isSubmitting} />
          </footer>

          {hasContent && <ExportTemplate ref={exportRef} conversation={conversation} />}
        </>
      )}
    </div>
  );
}

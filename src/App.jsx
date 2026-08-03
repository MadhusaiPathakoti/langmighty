import { useEffect, useRef, useState } from "react";
import ChatInput from "./components/ChatInput.jsx";
import ChatTurn from "./components/ChatTurn.jsx";
import ExportTemplate from "./components/ExportTemplate.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { useSpeechVoices } from "./hooks/useSpeechVoices.js";
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
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState(loadConversation);
  const [theme, setTheme] = useState(loadTheme);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const voices = useSpeechVoices();
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

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

  const hasContent = conversation.some((t) => t.status === "done");

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold">LangLearn AI</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            English to Kannada, Malayalam &amp; Tamil — with pronunciation and voice.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!hasContent}
            className="rounded-lg border border-indigo-600 text-indigo-600 dark:text-indigo-400
                       dark:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed font-medium
                       px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
          >
            Export to PDF
          </button>
          <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {conversation.length === 0 && (
            <p className="text-center text-gray-400 dark:text-gray-500 mt-16">
              Type an English sentence below to get started.
            </p>
          )}
          {conversation.map((turn) => (
            <ChatTurn key={turn.id} turn={turn} voices={voices} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <ChatInput value={inputText} onChange={setInputText} onSubmit={handleSubmit} loading={isSubmitting} />
      </footer>

      {hasContent && <ExportTemplate ref={exportRef} conversation={conversation} />}
    </div>
  );
}

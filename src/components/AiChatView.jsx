import { useEffect, useRef, useState } from "react";
import AiChatExportTemplate from "./AiChatExportTemplate.jsx";
import AiChatMessage from "./AiChatMessage.jsx";
import { exportNodeToPdf } from "../utils/pdfExport.js";

const AI_CHAT_KEY = "langlearn_ai_chat";

const EXAMPLE_PROMPTS = [
  "Teach me pronouns in Kannada with examples",
  "How do I say \"thank you\" formally in Tamil?",
  "Explain present tense verb conjugation in Hindi",
  "Give me 5 common greetings in Telugu",
];

function loadMessages() {
  try {
    const raw = localStorage.getItem(AI_CHAT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let messageCounter = 0;
function nextMessageId() {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

export default function AiChatView() {
  const [messages, setMessages] = useState(loadMessages);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const bottomRef = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(AI_CHAT_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    const history = messages
      .filter((m) => m.status === "done")
      .map((m) => ({ role: m.role, content: m.content }));

    const userMessage = { id: nextMessageId(), role: "user", content: trimmed, status: "done" };
    const assistantMessage = { id: nextMessageId(), role: "assistant", content: "", status: "loading", error: null };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputText("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? res.ok
              ? { ...m, status: "done", content: data.reply }
              : { ...m, status: "error", error: data.error || "The AI tutor could not respond. Please try again." }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, status: "error", error: "Could not reach the AI tutor. Check your connection and try again." }
            : m
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(inputText);
  }

  function handleDelete(id) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  function handleClear() {
    setMessages([]);
  }

  async function handleExportPdf() {
    if (!exportRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportNodeToPdf(exportRef.current, `langmighty-ai-chat-${Date.now()}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  }

  const hasContent = messages.some((m) => m.status === "done" && m.content?.trim());

  return (
    <div className="relative z-10 flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950 px-6 py-14 sm:py-16 text-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-purple-200/40 dark:bg-purple-500/10 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-indigo-200/40 dark:bg-indigo-500/10 blur-3xl"
              />
              <span className="relative text-3xl">💬</span>
              <h2 className="relative mt-3 text-xl sm:text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Ask your AI language tutor anything
              </h2>
              <p className="relative mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Grammar, vocabulary, pronunciation, or usage — for English, Telugu, Hindi, Kannada, Malayalam, and
                Tamil. Every answer comes with native script, roman pronunciation, and an English explanation.
              </p>
              <div className="relative mt-6 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-indigo-200 dark:border-indigo-800 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-end items-center gap-3">
              {hasContent && (
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-60"
                >
                  {isExportingPdf ? "Exporting..." : "Export to PDF"}
                </button>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Clear chat
              </button>
            </div>
          )}

          {messages.map((message) => (
            <AiChatMessage key={message.id} message={message} onDelete={handleDelete} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about grammar, vocabulary, pronunciation..."
              className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
                         text-gray-900 dark:text-gray-100 px-5 py-3 text-base focus:outline-none focus:ring-2
                         focus:ring-indigo-500 placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={isSubmitting || !inputText.trim()}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                         disabled:cursor-not-allowed text-white font-medium px-6 py-3 transition-colors"
            >
              {isSubmitting ? "..." : "Send"}
            </button>
          </form>
        </div>
      </footer>

      {hasContent && <AiChatExportTemplate ref={exportRef} messages={messages} />}
    </div>
  );
}

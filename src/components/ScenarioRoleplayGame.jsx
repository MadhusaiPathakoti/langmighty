import { useEffect, useRef, useState } from "react";
import { LANGUAGES, QUIZ_TARGET_LANGUAGES } from "langmighty-shared";
import { useAuthGate } from "../context/AuthGateContext.jsx";
import { apiFetch } from "../lib/apiClient.js";
import { LANGUAGE_TO_SPEECH_LOCALE } from "../readAloudData.js";
import { isSpeechRecognitionSupported, listenOnce } from "../utils/speechRecognition.js";

const ROLEPLAY_LANGUAGE_KEY = "langlearn_roleplay_language";

// Display metadata for the picker — ids must stay in sync with ROLEPLAY_SCENARIOS in api/chat.js.
const SCENARIOS = [
  { id: "cafe", emoji: "☕", title: "Order at a Café", blurb: "Order a drink and a snack, then pay." },
  { id: "directions", emoji: "🧭", title: "Ask for Directions", blurb: "You're lost — ask a local for help." },
  { id: "market", emoji: "🧺", title: "Haggle at the Market", blurb: "Browse a stall and agree on a price." },
  { id: "hotel", emoji: "🏨", title: "Check In at a Hotel", blurb: "Confirm your reservation at the front desk." },
  { id: "introductions", emoji: "🙋", title: "Meet Someone New", blurb: "Introduce yourself at a social gathering." },
];

// Sent as the first turn's message so the AI opens the scene — never rendered as a bubble.
const START_MESSAGE = "(Begin the scenario. Greet the learner and start the roleplay.)";

// Assistant turns are stored as { line, pronunciation, translation } objects for
// rendering, but the API's `history` only understands plain strings — flatten
// back down to one string per turn when sending context back to the server.
function turnContent(message) {
  if (message.role !== "assistant") return message.content;
  return `${message.content.line} (${message.content.translation})`;
}

function languageLabel(key) {
  return LANGUAGES.find((l) => l.key === key)?.label ?? key;
}

function loadRoleplayLanguage() {
  const saved = localStorage.getItem(ROLEPLAY_LANGUAGE_KEY);
  return QUIZ_TARGET_LANGUAGES.includes(saved) ? saved : QUIZ_TARGET_LANGUAGES[0];
}

let messageCounter = 0;
function nextMessageId() {
  messageCounter += 1;
  return `roleplay-msg-${Date.now()}-${messageCounter}`;
}

export default function ScenarioRoleplayGame({ onExit }) {
  const [targetLanguage, setTargetLanguage] = useState(loadRoleplayLanguage);
  const [scenarioId, setScenarioId] = useState(null);
  const [phase, setPhase] = useState("setup"); // "setup" | "playing" | "report"
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const bottomRef = useRef(null);
  const { requestAccess, consumeCredit, reportServerRejection, getAuthHeaders } = useAuthGate();
  const speechSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleLanguageChange(language) {
    setTargetLanguage(language);
    localStorage.setItem(ROLEPLAY_LANGUAGE_KEY, language);
  }

  // Mirrors ChatInput.jsx's voice flow: submit the heard transcript directly
  // rather than relying on setInputText landing before the send happens.
  function handleMicClick() {
    if (listening || isSubmitting) return;
    setMicError(null);
    setListening(true);

    listenOnce(LANGUAGE_TO_SPEECH_LOCALE[targetLanguage], {
      onResult: (transcript) => {
        const trimmed = transcript.trim();
        if (trimmed) {
          setInputText("");
          runTurn(trimmed);
        }
      },
      onError: () => setMicError("Couldn't hear you clearly — check your mic permission and try again."),
      onEnd: () => setListening(false),
    });
  }

  async function runTurn(userText) {
    if (!requestAccess()) return;
    setIsSubmitting(true);
    setRejected(false);
    consumeCredit();

    const history = messages.filter((m) => m.status === "done").map((m) => ({ role: m.role, content: turnContent(m) }));

    const assistantId = nextMessageId();
    const userMessage = userText ? { id: nextMessageId(), role: "user", content: userText, status: "done" } : null;
    const assistantMessage = { id: assistantId, role: "assistant", content: "", status: "loading" };

    setMessages((prev) => (userMessage ? [...prev, userMessage, assistantMessage] : [...prev, assistantMessage]));

    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          mode: "roleplay",
          scenario: scenarioId,
          targetLanguage,
          message: userText || START_MESSAGE,
          history,
        }),
      });

      if (res.status === 403) {
        reportServerRejection();
        setRejected(true);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId && m.id !== userMessage?.id));
        return;
      }

      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? res.ok
              ? { ...m, status: "done", content: data.reply }
              : { ...m, status: "error", error: data.error || "The character couldn't respond. Please try again." }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, status: "error", error: "Could not reach the server. Check your connection and try again." }
            : m
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function startScenario(id) {
    setScenarioId(id);
    setMessages([]);
    setReport(null);
    setReportError(null);
    setRejected(false);
    setPhase("playing");
  }

  // Fires the opening line once a scenario is picked, without a visible user bubble.
  useEffect(() => {
    if (phase === "playing" && scenarioId && messages.length === 0) {
      runTurn(null);
    }
  }, [phase, scenarioId]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSubmitting) return;
    setInputText("");
    runTurn(trimmed);
  }

  async function handleFinish() {
    if (isSubmitting) return;
    if (!requestAccess()) return;
    setIsSubmitting(true);
    setReportError(null);
    setRejected(false);
    consumeCredit();

    const history = messages.filter((m) => m.status === "done").map((m) => ({ role: m.role, content: turnContent(m) }));

    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ mode: "roleplay-report", scenario: scenarioId, targetLanguage, history }),
      });

      if (res.status === 403) {
        reportServerRejection();
        setRejected(true);
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
        setPhase("report");
      } else {
        setReportError(data.error || "Could not generate your feedback report. Please try again.");
      }
    } catch {
      setReportError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePlayAgain() {
    setScenarioId(null);
    setMessages([]);
    setReport(null);
    setReportError(null);
    setRejected(false);
    setPhase("setup");
  }

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const userTurnCount = messages.filter((m) => m.role === "user").length;

  if (phase === "setup") {
    return (
      <div>
        <div className="flex items-center justify-center gap-2 mb-5 text-sm">
          <label htmlFor="roleplay-language" className="text-gray-500 dark:text-gray-400">
            Practicing:
          </label>
          <select
            id="roleplay-language"
            value={targetLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5"
          >
            {QUIZ_TARGET_LANGUAGES.map((key) => (
              <option key={key} value={key}>
                {languageLabel(key)}
              </option>
            ))}
          </select>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          Pick a scene to chat your way through — uses your AI Chat credits.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => startScenario(s.id)}
              className="text-left rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-gray-900 p-5 transition-colors"
            >
              <span className="text-2xl">{s.emoji}</span>
              <h3 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.blurb}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "report") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950 px-6 py-10 text-center">
        <span className="text-5xl">🎭</span>
        <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">{report?.rating}</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-md mx-auto">{report?.headline}</p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
          <div className="rounded-xl bg-white/70 dark:bg-gray-900/50 border border-green-100 dark:border-green-900 p-4">
            <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">✅ What went well</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {(report?.wentWell || []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-gray-900/50 border border-amber-100 dark:border-amber-900 p-4">
            <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">💡 Try next time</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {(report?.tryNext || []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {report?.phrasesUsed?.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
            {report.phrasesUsed.map((phrase, i) => (
              <span
                key={i}
                className="rounded-full border border-indigo-200 dark:border-indigo-800 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 text-xs text-indigo-700 dark:text-indigo-300"
              >
                {phrase}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={handlePlayAgain}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors"
          >
            Play again
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Back to Playground
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {scenario?.emoji} {scenario?.title} · {languageLabel(targetLanguage)}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 min-h-[16rem] max-h-[28rem] overflow-y-auto">
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  isUser
                    ? "bg-indigo-600 text-white whitespace-pre-wrap break-words"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                }`}
              >
                {message.status === "loading" && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    ...
                  </div>
                )}
                {message.status === "error" && <p className="text-red-600 dark:text-red-400">{message.error}</p>}
                {message.status === "done" &&
                  (isUser ? (
                    message.content
                  ) : (
                    <div>
                      <p className="font-medium">{message.content.line}</p>
                      <p className="mt-0.5 italic text-gray-500 dark:text-gray-400">{message.content.pronunciation}</p>
                      <p className="mt-0.5 text-gray-500 dark:text-gray-400">({message.content.translation})</p>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {rejected && (
        <p className="mt-3 text-center text-sm text-amber-600 dark:text-amber-400">
          You've used your free prompts — sign in to keep chatting.
        </p>
      )}
      {reportError && <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">{reportError}</p>}
      {micError && <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">{micError}</p>}
      {listening && (
        <p className="mt-3 text-center text-sm text-indigo-600 dark:text-indigo-400">
          🎤 Listening... speak now in {languageLabel(targetLanguage)}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Reply in ${languageLabel(targetLanguage)}...`}
          className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
        />
        {speechSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={listening || isSubmitting}
            title={`Speak in ${languageLabel(targetLanguage)}`}
            className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg transition-colors ${
              listening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            🎤
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !inputText.trim()}
          className="rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 text-sm transition-colors"
        >
          Send
        </button>
      </form>

      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={handleFinish}
          disabled={isSubmitting || userTurnCount === 0}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          End & get feedback
        </button>
      </div>
    </div>
  );
}

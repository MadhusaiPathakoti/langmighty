import { useEffect, useRef, useState } from "react";
import { useAuthGate } from "../context/AuthGateContext.jsx";
import { apiFetch, isLimitReached, reportLimitFromResponse } from "../lib/apiClient.js";
import { playTranslation, stopAudio } from "../utils/tts.js";
import { isSpeechRecognitionSupported, listenContinuous } from "../utils/speechRecognition.js";
import {
  VOICE_ASSISTANT_LANGUAGES,
  VOICE_ASSISTANT_SPEECH_LOCALE,
  voiceAssistantLanguageInfo,
} from "../voiceAssistantLanguages.js";

const VOICE_ASSISTANT_KEY = "langlearn_voice_assistant";

const EXAMPLE_PROMPTS = [
  { text: "I want to learn Kannada", language: "english" },
  { text: "నాకు తెలుగు నేర్చుకోవాలి అనిపిస్తోంది", language: "telugu" },
  { text: "मुझे हिंदी में बातचीत करनी है", language: "hindi" },
  { text: "Teach me a few Tamil greetings", language: "english" },
];

function loadMessages() {
  try {
    const raw = localStorage.getItem(VOICE_ASSISTANT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let messageCounter = 0;
function nextMessageId() {
  messageCounter += 1;
  return `voice-msg-${Date.now()}-${messageCounter}`;
}

export default function VoiceAssistantView() {
  const [messages, setMessages] = useState(loadMessages);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [micError, setMicError] = useState(null);
  // Defaults to whatever language the assistant/practice-phrase last used, so
  // the NEXT mic session listens in that locale — the closest browser speech
  // recognition can get to "adapting" without a manual picker, since it has
  // no way to detect a spoken language before it starts capturing audio. That
  // guess is wrong whenever the learner wants to interject in a different
  // language than the one being practiced (e.g. asking "teach me verbs" in
  // English mid-Kannada-practice) — the selector below lets them override it
  // for a turn instead of getting garbled speech-to-text back.
  const [currentLanguage, setCurrentLanguage] = useState("english");

  const speechSupported = isSpeechRecognitionSupported();
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const { reportAuthRequired, reportLimitReached, getAuthHeaders } = useAuthGate();

  useEffect(() => {
    localStorage.setItem(VOICE_ASSISTANT_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Releases the mic and stops any playing reply if the learner navigates
  // away mid-conversation, rather than leaving either running in the background.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopAudio();
    };
  }, []);

  async function sendMessage(text, spokenLanguageGuess) {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    const history = messages
      .filter((m) => m.status === "done")
      .map((m) => ({ role: m.role, content: m.content }));

    const userMessage = { id: nextMessageId(), role: "user", content: trimmed, language: spokenLanguageGuess, status: "done" };
    const assistantMessage = { id: nextMessageId(), role: "assistant", content: "", status: "loading", language: null };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputText("");
    setIsSubmitting(true);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ mode: "voice-assistant", message: trimmed, history }),
      });

      if (res.status === 401) {
        reportAuthRequired();
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id && m.id !== assistantMessage.id));
        return;
      }

      if (isLimitReached(res)) {
        await reportLimitFromResponse(res, reportLimitReached);
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id && m.id !== assistantMessage.id));
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, status: "error", error: data.error || "The voice assistant could not respond. Please try again." }
              : m
          )
        );
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                status: "done",
                content: data.reply,
                language: data.language,
                translation: data.translation,
                practicePhraseNative: data.practicePhraseNative,
                practicePhraseRomanized: data.practicePhraseRomanized,
                practicePhraseLanguage: data.practicePhraseLanguage,
              }
            : m
        )
      );
      // When the reply teaches/asks the learner to try a phrase in a
      // different language than the reply itself (e.g. an English reply
      // asking them to try a Kannada phrase), the learner's next utterance
      // is almost certainly an attempt at THAT phrase, not more English —
      // so the next mic session should listen in the phrase's locale, not
      // the reply's own. Recognizing Kannada speech with an English-locale
      // recognizer is exactly what was producing garbled transcripts like
      // "Nanu Chennai" for "naanu chennagiddēne".
      setCurrentLanguage(data.practicePhraseLanguage || data.language);
      speakTurn({
        content: data.reply,
        language: data.language,
        practicePhraseNative: data.practicePhraseNative,
        practicePhraseLanguage: data.practicePhraseLanguage,
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, status: "error", error: "Could not reach the voice assistant. Check your connection and try again." }
            : m
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // A taught phrase is often in a different language than the reply itself
  // (e.g. an English reply teaching a Kannada greeting) — speaking it with
  // the reply's own voice would badly mispronounce it, so it's played as a
  // second, separate TTS call with the phrase's own language's voice, back
  // to back with the main reply rather than mixed into one voice track.
  function speakTurn({ content, language, practicePhraseNative, practicePhraseLanguage }) {
    setIsSpeaking(true);
    const playPhrase = () => {
      if (practicePhraseNative && practicePhraseLanguage) {
        playTranslation(practicePhraseNative, voiceAssistantLanguageInfo(practicePhraseLanguage).ttsVoice, {
          onEnded: () => setIsSpeaking(false),
        }).catch(() => setIsSpeaking(false));
      } else {
        setIsSpeaking(false);
      }
    };
    playTranslation(content, voiceAssistantLanguageInfo(language).ttsVoice, { onEnded: playPhrase }).catch(playPhrase);
  }

  function handleMicClick() {
    if (isListening || isSpeaking) return;
    setMicError(null);
    setLiveTranscript("");
    setIsListening(true);

    recognitionRef.current = listenContinuous(VOICE_ASSISTANT_SPEECH_LOCALE[currentLanguage] || "en-US", {
      onResult: (transcript) => setLiveTranscript(transcript),
      onError: () => {
        setMicError("Couldn't hear you clearly — check your mic permission and try again.");
        setIsListening(false);
      },
      onEnd: (finalTranscript) => {
        setIsListening(false);
        setLiveTranscript("");
        // Speech recognition for the regional languages mishears words often
        // enough that auto-sending straight to the AI produced confusing
        // replies to garbled input — landing it in the text box instead lets
        // the learner glance at (and fix) what was heard before it's sent.
        if (finalTranscript.trim()) setInputText(finalTranscript);
      },
    });
  }

  function handleStopListening() {
    recognitionRef.current?.stop();
  }

  function handleStopSpeaking() {
    stopAudio();
    setIsSpeaking(false);
  }

  function handleTextSubmit(e) {
    e.preventDefault();
    sendMessage(inputText, currentLanguage);
  }

  function handleClear() {
    recognitionRef.current?.stop();
    stopAudio();
    setIsSpeaking(false);
    setMessages([]);
    setCurrentLanguage("english");
  }

  function replayMessage(message) {
    if (message.status !== "done" || !message.content) return;
    speakTurn(message);
  }

  const micStatusLabel = isSpeaking
    ? "AI is speaking..."
    : isListening
      ? "Listening... tap to stop"
      : "Tap to speak";

  return (
    <>
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
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
              <span className="relative text-3xl">🎙️</span>
              <h2 className="relative mt-3 text-xl sm:text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Talk with your AI language partner
              </h2>
              <p className="relative mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Tap the mic and speak in English, Telugu, Hindi, Kannada, Malayalam, or Tamil — the assistant replies
                out loud in whichever language you used, and keeps adapting as the conversation goes.
              </p>
              <div className="relative mt-6 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.text}
                    type="button"
                    onClick={() => sendMessage(prompt.text, prompt.language)}
                    className="rounded-full border border-indigo-200 dark:border-indigo-800 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300
                           font-medium px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Clear conversation
              </button>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user";
            const langInfo = message.language ? voiceAssistantLanguageInfo(message.language) : null;
            return (
              <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`min-w-0 max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                  }`}
                >
                  {message.status === "loading" && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      Thinking...
                    </div>
                  )}
                  {message.status === "error" && (
                    <p className={isUser ? "text-red-100" : "text-red-600 dark:text-red-400"}>{message.error}</p>
                  )}
                  {message.status === "done" && (
                    <>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      {!isUser && message.language !== "english" && message.translation && (
                        <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400 break-words">
                          {message.translation}
                        </p>
                      )}
                      {!isUser && message.practicePhraseNative && (
                        <p className="mt-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-300 break-words">
                          🗣️ {message.practicePhraseNative}
                          {message.practicePhraseRomanized && (
                            <span className="ml-1 font-normal italic text-indigo-500 dark:text-indigo-400">
                              ({message.practicePhraseRomanized})
                            </span>
                          )}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        {langInfo && (
                          <span
                            className={`text-[11px] font-medium uppercase tracking-wide ${
                              isUser ? "text-indigo-200" : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {langInfo.label}
                          </span>
                        )}
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => replayMessage(message)}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                            title="Play this reply again"
                          >
                            🔊 Replay
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm px-4 sm:px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto w-full flex flex-col items-center gap-3">
          {speechSupported ? (
            <>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <label htmlFor="voice-assistant-speak-language">Speaking in:</label>
                  <select
                    id="voice-assistant-speak-language"
                    value={currentLanguage}
                    onChange={(e) => setCurrentLanguage(e.target.value)}
                    disabled={isListening || isSpeaking}
                    title="Override which language the mic listens for — useful if you want to say something in a different language than the conversation is currently in"
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 disabled:opacity-60"
                  >
                    {VOICE_ASSISTANT_LANGUAGES.map((lang) => (
                      <option key={lang.key} value={lang.key}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={isListening ? handleStopListening : handleMicClick}
                    disabled={isSpeaking || isSubmitting}
                    title={isListening ? "Tap to stop listening" : "Tap and speak"}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-colors ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isListening ? "⏹" : "🎤"}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{micStatusLabel}</p>
                </div>
              </div>
              <div className="text-center">
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={handleStopSpeaking}
                    className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Stop and speak now
                  </button>
                )}
                {liveTranscript && (
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 italic max-w-sm">"{liveTranscript}"</p>
                )}
                {!isListening && !liveTranscript && inputText && (
                  <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                    Check what was heard below, fix anything wrong, then tap Send.
                  </p>
                )}
                {micError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{micError}</p>}
              </div>
            </>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
              🎤 Voice input isn't supported in this browser (try Chrome) — you can still type below.
            </p>
          )}

          <form onSubmit={handleTextSubmit} className="flex gap-3 w-full">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="...or type in any of the six languages"
              className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
                         text-gray-900 dark:text-gray-100 px-5 py-2.5 text-sm focus:outline-none focus:ring-2
                         focus:ring-indigo-500 placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={isSubmitting || !inputText.trim()}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                         disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 text-sm transition-colors"
            >
              {isSubmitting ? "..." : "Send"}
            </button>
          </form>
        </div>
      </footer>
    </>
  );
}

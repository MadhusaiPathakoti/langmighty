import { useState } from "react";
import { getInputLanguage } from "langmighty-shared";
import { isSpeechRecognitionSupported, listenOnce } from "../utils/speechRecognition.js";

// Not exported by langmighty-shared (which only defines TTS voices), so kept
// local to this component — the one place Translate needs a speech-input locale.
const INPUT_LANGUAGE_TO_SPEECH_LOCALE = {
  english: "en-US",
  telugu: "te-IN",
  hindi: "hi-IN",
  kannada: "kn-IN",
  malayalam: "ml-IN",
  tamil: "ta-IN",
};

export default function ChatInput({ value, onChange, onSubmit, onVoiceResult, loading, inputLanguage, error }) {
  const speechSupported = isSpeechRecognitionSupported();
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit();
  }

  function handleMicClick() {
    if (listening) return;
    setMicError(null);
    setListening(true);

    listenOnce(INPUT_LANGUAGE_TO_SPEECH_LOCALE[inputLanguage] || "en-US", {
      onResult: (transcript) => {
        if (transcript.trim()) onVoiceResult(transcript);
      },
      onError: () => setMicError("Couldn't hear you clearly — check your mic permission and try again."),
      onEnd: () => setListening(false),
    });
  }

  const lang = getInputLanguage(inputLanguage);
  const placeholder =
    lang.key === "english"
      ? "Type an English sentence or phrase, e.g. What is your name?"
      : `Type in ${lang.label} (${lang.nativeName})...`;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
                     text-gray-900 dark:text-gray-100 px-5 py-3 text-base focus:outline-none focus:ring-2
                     focus:ring-indigo-500 placeholder:text-gray-400"
        />
        {speechSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={listening || loading}
            title={`Speak in ${lang.label}`}
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg transition-colors ${
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
          disabled={loading || !value.trim()}
          className="rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                     disabled:cursor-not-allowed text-white font-medium px-6 py-3 transition-colors"
        >
          {loading ? "..." : "Translate"}
        </button>
      </form>
      {listening && (
        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1.5 px-2">
          🎤 Listening... speak now in {lang.label}
        </p>
      )}
      {micError && <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 px-2">{micError}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 px-2">{error}</p>}
    </div>
  );
}

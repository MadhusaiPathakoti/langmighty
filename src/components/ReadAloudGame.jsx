import { useEffect, useRef, useState } from "react";
import { WORD_CHAIN_SENTENCES, QUIZ_TARGET_LANGUAGES, trackSeenIds, LANGUAGES } from "langmighty-shared";
import { loadExtraSentences } from "../wordChainData.js";
import {
  loadExtraShortSentences,
  loadExtraLongSentences,
  bucketByDifficulty,
  LANGUAGE_TO_SPEECH_LOCALE,
} from "../readAloudData.js";
import { isSpeechRecognitionSupported, listenOnce } from "../utils/speechRecognition.js";
import { similarity } from "../utils/textCompare.js";
import SpeakerButton from "./SpeakerButton.jsx";

const DIFFICULTIES = [
  { key: "easy", label: "Easy (1-2 words)" },
  { key: "medium", label: "Medium (3-5 words)" },
  { key: "hard", label: "Hard (6-10 words)" },
];

const LANGUAGE_KEY = "langlearn_readaloud_language";
const DIFFICULTY_KEY = "langlearn_readaloud_difficulty";
const CORRECT_THRESHOLD = 0.8;

function languageInfo(key) {
  return LANGUAGES.find((l) => l.key === key);
}

function loadSavedLanguage() {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  return QUIZ_TARGET_LANGUAGES.includes(saved) ? saved : QUIZ_TARGET_LANGUAGES[0];
}

function loadSavedDifficulty() {
  const saved = localStorage.getItem(DIFFICULTY_KEY);
  return DIFFICULTIES.some((d) => d.key === saved) ? saved : "easy";
}

// Fresh (not-yet-seen) sentences first, only falling back to the full pool
// (restarting the cycle) once every sentence in it has been used.
function pickNext(pool, excludeIds) {
  const exclude = new Set(excludeIds);
  const fresh = pool.filter((s) => !exclude.has(s.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export default function ReadAloudGame({ onExit }) {
  const supported = isSpeechRecognitionSupported();

  const [language, setLanguage] = useState(loadSavedLanguage);
  const [difficulty, setDifficulty] = useState(loadSavedDifficulty);
  const [allSentences, setAllSentences] = useState(WORD_CHAIN_SENTENCES);
  const recentIdsRef = useRef([]);

  const [sentence, setSentence] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | listening | correct | wrong | error
  const [transcript, setTranscript] = useState("");
  const [showHint, setShowHint] = useState(false);
  const recognitionRef = useRef(null);

  // Releases the mic if the player navigates away (or switches sentence/language)
  // mid-listen, rather than leaving recognition running in the background.
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadExtraSentences(), loadExtraShortSentences(), loadExtraLongSentences()]).then(
      ([extra, short, long]) => {
        const combined = [...extra, ...short, ...long];
        if (!cancelled && combined.length > 0) {
          setAllSentences([...WORD_CHAIN_SENTENCES, ...combined]);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const pool = bucketByDifficulty(allSentences, language)[difficulty];

  function startNewSentence(pool, excludeIds) {
    recognitionRef.current?.stop();
    if (pool.length === 0) {
      setSentence(null);
      return;
    }
    const next = pickNext(pool, excludeIds);
    recentIdsRef.current = trackSeenIds(excludeIds, [next.id], pool.length);
    setSentence(next);
    setStatus("idle");
    setTranscript("");
    setShowHint(false);
  }

  useEffect(() => {
    startNewSentence(pool, []);
    // Re-picks whenever the pool identity changes (language/difficulty change,
    // or the AI-generated extra content finishes loading).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, difficulty, allSentences]);

  function handleLanguageChange(key) {
    setLanguage(key);
    localStorage.setItem(LANGUAGE_KEY, key);
  }

  function handleDifficultyChange(key) {
    setDifficulty(key);
    localStorage.setItem(DIFFICULTY_KEY, key);
  }

  function handleRecord() {
    if (!sentence || status === "listening") return;
    setStatus("listening");
    setTranscript("");

    recognitionRef.current = listenOnce(LANGUAGE_TO_SPEECH_LOCALE[language], {
      onResult: (text) => {
        setTranscript(text);
        const expected = sentence.translations[language].join(" ");
        setStatus(similarity(text, expected) >= CORRECT_THRESHOLD ? "correct" : "wrong");
      },
      onError: () => setStatus("error"),
      // Recognition can end with no result (silence, or the user stopping it
      // manually) without onResult/onError ever firing — without this, status
      // would stay stuck on "listening" forever with no way back to idle.
      onEnd: () => setStatus((s) => (s === "listening" ? "idle" : s)),
    });
  }

  function handleStopListening() {
    recognitionRef.current?.stop();
  }

  function handleNext() {
    startNewSentence(pool, recentIdsRef.current);
  }

  const controls = (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-4 text-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="read-aloud-language" className="text-gray-500 dark:text-gray-400">
          Language:
        </label>
        <select
          id="read-aloud-language"
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5"
        >
          {QUIZ_TARGET_LANGUAGES.map((key) => (
            <option key={key} value={key}>
              {languageInfo(key)?.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="read-aloud-difficulty" className="text-gray-500 dark:text-gray-400">
          Difficulty:
        </label>
        <select
          id="read-aloud-difficulty"
          value={difficulty}
          onChange={(e) => handleDifficultyChange(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  if (!supported) {
    return (
      <div>
        {controls}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-6 py-10 text-center">
          <p className="text-amber-700 dark:text-amber-300 font-medium">
            🎤 Speech recognition isn't supported in this browser.
          </p>
          <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
            Read Aloud needs Chrome (desktop or Android) to capture and check your pronunciation.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="mt-5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-medium px-4 py-2 text-sm hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
          >
            Back to Playground
          </button>
        </div>
      </div>
    );
  }

  if (!sentence) {
    return (
      <div>
        {controls}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">
          No sentences available at this difficulty yet — try Easy or Medium, or check back after more content is added.
        </p>
      </div>
    );
  }

  const text = sentence.translations[language].join(" ");
  const pronunciation = sentence.pronunciation[language].join(" ");

  return (
    <div>
      {controls}

      <div
        className={`rounded-2xl border px-6 py-10 text-center transition-colors duration-300 ${
          status === "correct"
            ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950"
            : status === "wrong"
              ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
        }`}
      >
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{text}</p>

        {showHint && (
          <p className="mt-2 text-gray-500 dark:text-gray-400 italic">{pronunciation}</p>
        )}

        <div className="mt-5 flex flex-col items-center gap-1.5">
          <SpeakerButton text={text} voice={languageInfo(language)?.ttsVoice} label={languageInfo(language)?.label} size="lg" />
          <p className="text-xs text-gray-400 dark:text-gray-500">Tap to hear it pronounced correctly first</p>
        </div>

        <button
          type="button"
          onClick={status === "listening" ? handleStopListening : handleRecord}
          className={`mt-6 w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto transition-colors ${
            status === "listening"
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
          title={status === "listening" ? "Tap to stop listening" : "Tap and read the sentence aloud"}
        >
          {status === "listening" ? "⏹" : "🎤"}
        </button>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {status === "listening" ? "Listening... tap to stop" : "Tap the mic and read the sentence aloud"}
        </p>

        {status !== "correct" && (
          <div className="mt-3 flex items-center justify-center gap-4">
            {!showHint && (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Hint (show pronunciation)
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:underline"
            >
              Skip →
            </button>
          </div>
        )}

        {transcript && status !== "idle" && status !== "listening" && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Heard: <span className="italic">"{transcript}"</span>
          </p>
        )}

        {status === "wrong" && (
          <p className="mt-2 text-sm font-medium text-red-500 dark:text-red-400">❌ Not quite — try again!</p>
        )}
        {status === "error" && (
          <p className="mt-2 text-sm font-medium text-red-500 dark:text-red-400">
            Couldn't hear you clearly — check your mic permission and try again.
          </p>
        )}

        {status === "correct" && (
          <div className="mt-4">
            <p className="text-2xl">🎉</p>
            <p className="font-semibold text-green-700 dark:text-green-300">Correct!</p>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Meaning: <span className="font-medium">{sentence.english}</span>
            </p>
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors"
            >
              Next sentence
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  generateQuiz,
  getPhrasesForCategories,
  loadExtraPhrases,
  QUIZ_PHRASES,
  QUIZ_TARGET_LANGUAGES,
  trackSeenIds,
} from "../quizData.js";
import { LANGUAGES } from "../languages.js";
import TopicPicker, { loadQuizCategories } from "./TopicPicker.jsx";

const ROUND_SECONDS = 60;
// Generated once per round, well above what anyone can answer in 60s; wraps
// around (rare) rather than crashing if somehow exhausted.
const BATCH_SIZE = 50;
const FEEDBACK_MS = 350;
const SPEED_LANGUAGE_KEY = "langlearn_speed_language";
const SPEED_CATEGORIES_KEY = "langlearn_speed_categories";

function languageLabel(key) {
  return LANGUAGES.find((l) => l.key === key)?.label ?? key;
}

function loadSpeedLanguage() {
  const saved = localStorage.getItem(SPEED_LANGUAGE_KEY);
  return saved === "mixed" || QUIZ_TARGET_LANGUAGES.includes(saved) ? saved : "mixed";
}

export default function SpeedTranslateGame({ onExit }) {
  const [targetLanguage, setTargetLanguage] = useState(loadSpeedLanguage);
  const [categoryKeys, setCategoryKeys] = useState(() => loadQuizCategories(SPEED_CATEGORIES_KEY));
  // Phrase ids used in the round just played — passed as excludeIds so a replay
  // prefers fresh words over immediately reshowing the same ones.
  const recentIdsRef = useRef([]);

  const [phase, setPhase] = useState("ready"); // "ready" | "playing" | "finished"
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [feedback, setFeedback] = useState(null); // { option, correct }
  const [wrongAnswers, setWrongAnswers] = useState([]);

  const feedbackTimeoutRef = useRef(null);
  // Starts as just the static bank; upgraded once the AI-generated + Redis-cached
  // extra phrases load (by the time "Start" is clicked, this has usually resolved).
  const [allPhrases, setAllPhrases] = useState(QUIZ_PHRASES);
  const availableCount = getPhrasesForCategories(categoryKeys, allPhrases).length;

  useEffect(() => {
    let cancelled = false;
    loadExtraPhrases().then((extra) => {
      if (!cancelled && extra.length > 0) setAllPhrases([...QUIZ_PHRASES, ...extra]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      setPhase("finished");
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft]);

  useEffect(() => () => clearTimeout(feedbackTimeoutRef.current), []);

  function startRound() {
    const excludeIds = recentIdsRef.current;
    const result = generateQuiz(BATCH_SIZE, { targetLanguage, categoryKeys, excludeIds, allPhrases });
    recentIdsRef.current = trackSeenIds(excludeIds, result.usedIds, getPhrasesForCategories(categoryKeys, allPhrases).length);
    setQuestions(result.questions);
    setQuestionIndex(0);
    setScore(0);
    setAttempted(0);
    setTimeLeft(ROUND_SECONDS);
    setFeedback(null);
    setWrongAnswers([]);
    setPhase("playing");
  }

  function handleLanguageChange(language) {
    setTargetLanguage(language);
    localStorage.setItem(SPEED_LANGUAGE_KEY, language);
    recentIdsRef.current = [];
    setPhase("ready");
  }

  function handleCategoryToggle(key) {
    setCategoryKeys((prev) => {
      const next = prev.includes(key) ? (prev.length === 1 ? prev : prev.filter((k) => k !== key)) : [...prev, key];
      localStorage.setItem(SPEED_CATEGORIES_KEY, JSON.stringify(next));
      return next;
    });
    recentIdsRef.current = [];
    setPhase("ready");
  }

  function handleAnswer(option) {
    if (feedback) return;
    const question = questions[questionIndex % questions.length];
    const correct = option === question.correctAnswer;
    setAttempted((a) => a + 1);
    if (correct) {
      setScore((s) => s + 1);
    } else {
      setWrongAnswers((prev) => [
        ...prev,
        {
          english: question.english,
          targetLanguage: question.targetLanguage,
          yourAnswer: option,
          correctAnswer: question.correctAnswer,
        },
      ]);
    }
    setFeedback({ option, correct });

    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setQuestionIndex((i) => i + 1);
    }, FEEDBACK_MS);
  }

  const controls = (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-4 text-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="speed-language" className="text-gray-500 dark:text-gray-400">
          Practicing:
        </label>
        <select
          id="speed-language"
          value={targetLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={phase === "playing"}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5 disabled:opacity-50"
        >
          <option value="mixed">All languages (mixed)</option>
          {QUIZ_TARGET_LANGUAGES.map((key) => (
            <option key={key} value={key}>
              {languageLabel(key)} only
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-500 dark:text-gray-400">Topics:</span>
        <TopicPicker selected={categoryKeys} onToggle={handleCategoryToggle} disabled={phase === "playing"} />
      </div>
    </div>
  );

  if (phase === "ready") {
    return (
      <div>
        {controls}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950 px-6 py-14 text-center">
          <span className="text-5xl">⚡</span>
          <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">Speed Translate</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {ROUND_SECONDS} seconds on the clock. Answer as many translations correctly as you can — every answer
            moves straight to the next question.
          </p>
          {availableCount < 10 && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Only {availableCount} words in this topic selection — words will repeat quickly.
            </p>
          )}
          <button
            type="button"
            onClick={startRound}
            className="mt-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 text-sm transition-colors"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  if (phase === "finished") {
    const accuracy = attempted > 0 ? Math.round((score / attempted) * 100) : 0;
    return (
      <div>
        {controls}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950 px-6 py-10 text-center">
          <span className="text-5xl">⏱️</span>
          <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">Time's up!</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{score}</span> correct out of{" "}
            {attempted} attempted ({accuracy}% accuracy)
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={startRound}
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

        {wrongAnswers.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Review your mistakes ({wrongAnswers.length})
            </h3>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {wrongAnswers.map((mistake, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    "{mistake.english}" ({languageLabel(mistake.targetLanguage)})
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    You said <span className="text-red-500 dark:text-red-400 line-through">{mistake.yourAnswer}</span>{" "}
                    · Correct:{" "}
                    <span className="font-medium text-green-600 dark:text-green-400">{mistake.correctAnswer}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : attempted > 0 ? (
          <p className="mt-4 text-center text-sm text-green-600 dark:text-green-400">
            🎯 Perfect round — no mistakes!
          </p>
        ) : null}
      </div>
    );
  }

  const question = questions[questionIndex % questions.length];

  return (
    <div>
      {controls}
      <div className="flex items-center justify-between text-sm mb-3">
        <span className="font-medium text-indigo-600 dark:text-indigo-400">Score: {score}</span>
        <span
          className={`font-semibold ${timeLeft <= 10 ? "text-red-500 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}`}
        >
          ⏱️ {timeLeft}s
        </span>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-8">
        <p className="text-center text-lg font-medium text-gray-900 dark:text-gray-100">
          What is <span className="text-indigo-600 dark:text-indigo-400">"{question.english}"</span> in{" "}
          {languageLabel(question.targetLanguage)}?
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options.map((option, i) => {
            const isFeedbackTarget = feedback?.option === option;
            const showCorrect = feedback && option === question.correctAnswer;
            const classes = showCorrect
              ? "border-green-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              : isFeedbackTarget && !feedback.correct
                ? "border-red-500 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                : "border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-gray-800 dark:text-gray-100";
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleAnswer(option)}
                disabled={Boolean(feedback)}
                className={`rounded-xl border-2 px-4 py-3 text-base text-left transition-all ${classes}`}
              >
                <span className="text-gray-400 dark:text-gray-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

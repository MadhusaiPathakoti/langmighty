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
import SpeakerButton from "./SpeakerButton.jsx";

const QUESTION_COUNT = 10;
const LISTEN_LANGUAGE_KEY = "langlearn_listen_language";
const LISTEN_CATEGORIES_KEY = "langlearn_listen_categories";

function languageInfo(key) {
  return LANGUAGES.find((l) => l.key === key);
}

function loadListenLanguage() {
  const saved = localStorage.getItem(LISTEN_LANGUAGE_KEY);
  return saved === "mixed" || QUIZ_TARGET_LANGUAGES.includes(saved) ? saved : "mixed";
}

export default function ListenGuessGame({ onExit }) {
  const [targetLanguage, setTargetLanguage] = useState(loadListenLanguage);
  const [categoryKeys, setCategoryKeys] = useState(() => loadQuizCategories(LISTEN_CATEGORIES_KEY));
  // Phrase ids used in the round just played — passed as excludeIds so a replay
  // prefers fresh words over immediately reshowing the same ones.
  const recentIdsRef = useRef([]);
  // Starts as just the static bank; upgraded once the AI-generated + Redis-cached
  // extra phrases load (later rounds pick up the larger pool automatically).
  const [allPhrases, setAllPhrases] = useState(QUIZ_PHRASES);

  useEffect(() => {
    let cancelled = false;
    loadExtraPhrases().then((extra) => {
      if (!cancelled && extra.length > 0) setAllPhrases([...QUIZ_PHRASES, ...extra]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [questions, setQuestions] = useState(() => {
    const result = generateQuiz(QUESTION_COUNT, {
      targetLanguage: loadListenLanguage(),
      categoryKeys: loadQuizCategories(LISTEN_CATEGORIES_KEY),
    });
    recentIdsRef.current = result.usedIds;
    return result.questions;
  });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongOptions, setWrongOptions] = useState(new Set());
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);

  const finished = questionIndex >= questions.length;
  const availableCount = getPhrasesForCategories(categoryKeys, allPhrases).length;

  function startNewRound(language, categories, { resetHistory } = {}) {
    const excludeIds = resetHistory ? [] : recentIdsRef.current;
    const result = generateQuiz(QUESTION_COUNT, {
      targetLanguage: language,
      categoryKeys: categories,
      excludeIds,
      allPhrases,
    });
    recentIdsRef.current = trackSeenIds(excludeIds, result.usedIds, getPhrasesForCategories(categories, allPhrases).length);
    setQuestions(result.questions);
    setQuestionIndex(0);
    setScore(0);
    setWrongOptions(new Set());
    setAnsweredCorrectly(false);
  }

  function handleRestart() {
    startNewRound(targetLanguage, categoryKeys);
  }

  function handleLanguageChange(language) {
    setTargetLanguage(language);
    localStorage.setItem(LISTEN_LANGUAGE_KEY, language);
    startNewRound(language, categoryKeys, { resetHistory: true });
  }

  function handleCategoryToggle(key) {
    setCategoryKeys((prev) => {
      const next = prev.includes(key) ? (prev.length === 1 ? prev : prev.filter((k) => k !== key)) : [...prev, key];
      localStorage.setItem(LISTEN_CATEGORIES_KEY, JSON.stringify(next));
      startNewRound(targetLanguage, next, { resetHistory: true });
      return next;
    });
  }

  const controls = (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-4 text-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="listen-language" className="text-gray-500 dark:text-gray-400">
          Practicing:
        </label>
        <select
          id="listen-language"
          value={targetLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5"
        >
          <option value="mixed">All languages (mixed)</option>
          {QUIZ_TARGET_LANGUAGES.map((key) => (
            <option key={key} value={key}>
              {languageInfo(key)?.label} only
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-500 dark:text-gray-400">Topics:</span>
        <TopicPicker selected={categoryKeys} onToggle={handleCategoryToggle} />
      </div>
    </div>
  );

  if (finished) {
    return (
      <div>
        {controls}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950 px-6 py-14 text-center">
          <span className="text-5xl">🏆</span>
          <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">Round complete!</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            You scored <span className="font-semibold text-indigo-600 dark:text-indigo-400">{score}</span> out of{" "}
            {questions.length}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
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
      </div>
    );
  }

  const question = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const lang = languageInfo(question.targetLanguage);

  function handleSelect(option) {
    if (answeredCorrectly) return;
    if (option === question.correctAnswer) {
      setAnsweredCorrectly(true);
      setScore((s) => s + 1);
    } else {
      setWrongOptions((prev) => new Set(prev).add(option));
    }
  }

  function handleNext() {
    setWrongOptions(new Set());
    setAnsweredCorrectly(false);
    setQuestionIndex((i) => i + 1);
  }

  return (
    <div>
      {controls}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
        <span>
          Question {questionIndex + 1} of {questions.length}
        </span>
        <span className="font-medium text-indigo-600 dark:text-indigo-400">Score: {score}</span>
      </div>

      {availableCount < QUESTION_COUNT && (
        <p className="text-center text-xs text-amber-600 dark:text-amber-400 mb-3">
          Only {availableCount} words in this topic selection — some may repeat this round.
        </p>
      )}

      <div
        className={`rounded-2xl border px-6 py-8 transition-colors duration-300 ${
          answeredCorrectly
            ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950"
            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <SpeakerButton text={question.correctAnswer} voice={lang?.ttsVoice} label={lang?.label} size="lg" />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Tap to hear the word in {lang?.label} — listen as many times as you like
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options.map((option, i) => {
            const isWrong = wrongOptions.has(option);
            const isCorrectRevealed = answeredCorrectly && option === question.correctAnswer;
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={isWrong || answeredCorrectly}
                className={`rounded-xl border-2 px-4 py-3 text-base text-left transition-all ${
                  isCorrectRevealed
                    ? "border-green-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 scale-[1.02]"
                    : isWrong
                      ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-400 dark:text-red-500 line-through cursor-not-allowed"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-gray-800 dark:text-gray-100"
                }`}
              >
                <span className="text-gray-400 dark:text-gray-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            );
          })}
        </div>

        {!answeredCorrectly && wrongOptions.size > 0 && (
          <p className="mt-4 text-center text-sm font-medium text-red-500 dark:text-red-400">
            ❌ Not quite — listen again and try again!
          </p>
        )}

        {answeredCorrectly && (
          <div className="mt-5 text-center">
            <p className="text-2xl animate-bounce">🎉</p>
            <p className="font-semibold text-green-700 dark:text-green-300">
              Correct! That's "{question.english}" in {lang?.label}.
            </p>
            <button
              type="button"
              onClick={handleNext}
              className="mt-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors"
            >
              {isLastQuestion ? "See results" : "Next question"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  generateWordMatchRound,
  getPhrasesForCategories,
  shuffle,
  QUIZ_PHRASES,
  QUIZ_TARGET_LANGUAGES,
  trackSeenIds,
  LANGUAGES,
} from "langmighty-shared";
import { loadExtraPhrases } from "../quizData.js";
import TopicPicker, { loadQuizCategories } from "./TopicPicker.jsx";

const PAIR_COUNT = 8;
const WORDMATCH_LANGUAGE_KEY = "langlearn_wordmatch_language";
const WORDMATCH_CATEGORIES_KEY = "langlearn_wordmatch_categories";
const WRONG_FLASH_MS = 500;

function languageLabel(key) {
  return LANGUAGES.find((l) => l.key === key)?.label ?? key;
}

function loadWordMatchLanguage() {
  const saved = localStorage.getItem(WORDMATCH_LANGUAGE_KEY);
  return saved === "mixed" || QUIZ_TARGET_LANGUAGES.includes(saved) ? saved : "mixed";
}

function shuffledIndices(count) {
  return shuffle(Array.from({ length: count }, (_, i) => i));
}

export default function WordMatchGame({ onExit }) {
  const [targetLanguage, setTargetLanguage] = useState(loadWordMatchLanguage);
  const [categoryKeys, setCategoryKeys] = useState(() => loadQuizCategories(WORDMATCH_CATEGORIES_KEY));
  // Phrase ids used in the round(s) just played — passed as excludeIds so a replay
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

  const [pairs, setPairs] = useState(() => {
    const result = generateWordMatchRound(PAIR_COUNT, {
      targetLanguage: loadWordMatchLanguage(),
      categoryKeys: loadQuizCategories(WORDMATCH_CATEGORIES_KEY),
    });
    recentIdsRef.current = result.usedIds;
    return result.pairs;
  });
  const [leftOrder, setLeftOrder] = useState(() => shuffledIndices(pairs.length));
  const [rightOrder, setRightOrder] = useState(() => shuffledIndices(pairs.length));
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [wrongFlash, setWrongFlash] = useState(null); // { left, right } pair indices
  const [mistakes, setMistakes] = useState(0);

  const finished = pairs.length > 0 && matchedIds.size === pairs.length;
  const availableCount = getPhrasesForCategories(categoryKeys, allPhrases).length;

  function startNewRound(language, categories, { resetHistory } = {}) {
    const excludeIds = resetHistory ? [] : recentIdsRef.current;
    const result = generateWordMatchRound(PAIR_COUNT, {
      targetLanguage: language,
      categoryKeys: categories,
      excludeIds,
      allPhrases,
    });
    recentIdsRef.current = trackSeenIds(excludeIds, result.usedIds, getPhrasesForCategories(categories, allPhrases).length);
    setPairs(result.pairs);
    setLeftOrder(shuffledIndices(result.pairs.length));
    setRightOrder(shuffledIndices(result.pairs.length));
    setMatchedIds(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongFlash(null);
    setMistakes(0);
  }

  function handleRestart() {
    startNewRound(targetLanguage, categoryKeys);
  }

  function handleLanguageChange(language) {
    setTargetLanguage(language);
    localStorage.setItem(WORDMATCH_LANGUAGE_KEY, language);
    startNewRound(language, categoryKeys, { resetHistory: true });
  }

  function handleCategoryToggle(key) {
    setCategoryKeys((prev) => {
      const next = prev.includes(key) ? (prev.length === 1 ? prev : prev.filter((k) => k !== key)) : [...prev, key];
      localStorage.setItem(WORDMATCH_CATEGORIES_KEY, JSON.stringify(next));
      startNewRound(targetLanguage, next, { resetHistory: true });
      return next;
    });
  }

  function attemptMatch(leftIdx, rightIdx) {
    if (leftIdx === rightIdx) {
      setMatchedIds((prev) => new Set(prev).add(pairs[leftIdx].id));
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setMistakes((m) => m + 1);
      setWrongFlash({ left: leftIdx, right: rightIdx });
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, WRONG_FLASH_MS);
    }
  }

  function handleClickLeft(pairIndex) {
    if (wrongFlash || matchedIds.has(pairs[pairIndex].id)) return;
    if (selectedLeft === pairIndex) {
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft(pairIndex);
    if (selectedRight !== null) attemptMatch(pairIndex, selectedRight);
  }

  function handleClickRight(pairIndex) {
    if (wrongFlash || matchedIds.has(pairs[pairIndex].id)) return;
    if (selectedRight === pairIndex) {
      setSelectedRight(null);
      return;
    }
    setSelectedRight(pairIndex);
    if (selectedLeft !== null) attemptMatch(selectedLeft, pairIndex);
  }

  function cardClasses({ pairIndex, isSelected, isWrongSide }) {
    const isMatched = matchedIds.has(pairs[pairIndex].id);
    if (isMatched) {
      return "border-green-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 cursor-default";
    }
    if (isWrongSide) {
      return "border-red-400 bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400";
    }
    if (isSelected) {
      return "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 scale-[1.02]";
    }
    return "border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-gray-800 dark:text-gray-100";
  }

  const controls = (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-4 text-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="wordmatch-language" className="text-gray-500 dark:text-gray-400">
          Practicing:
        </label>
        <select
          id="wordmatch-language"
          value={targetLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5"
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
          <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">All matched!</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {pairs.length} pairs matched with{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{mistakes}</span>{" "}
            {mistakes === 1 ? "mistake" : "mistakes"}
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

  return (
    <div>
      {controls}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
        <span>
          Matched {matchedIds.size} of {pairs.length}
        </span>
        <span className="font-medium text-indigo-600 dark:text-indigo-400">Mistakes: {mistakes}</span>
      </div>

      {availableCount < PAIR_COUNT && (
        <p className="text-center text-xs text-amber-600 dark:text-amber-400 mb-3">
          Only {availableCount} words in this topic selection — the round is shorter than usual.
        </p>
      )}

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
        Tap an English word, then its matching translation.
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        <div className="space-y-2">
          {leftOrder.map((pairIndex) => (
            <button
              key={pairs[pairIndex].id}
              type="button"
              onClick={() => handleClickLeft(pairIndex)}
              disabled={matchedIds.has(pairs[pairIndex].id)}
              className={`w-full rounded-xl border-2 px-4 py-3 text-sm text-left transition-all ${cardClasses({
                pairIndex,
                isSelected: selectedLeft === pairIndex,
                isWrongSide: wrongFlash?.left === pairIndex,
              })}`}
            >
              {pairs[pairIndex].english}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {rightOrder.map((pairIndex) => (
            <button
              key={pairs[pairIndex].id}
              type="button"
              onClick={() => handleClickRight(pairIndex)}
              disabled={matchedIds.has(pairs[pairIndex].id)}
              className={`w-full rounded-xl border-2 px-4 py-3 text-sm text-left transition-all ${cardClasses({
                pairIndex,
                isSelected: selectedRight === pairIndex,
                isWrongSide: wrongFlash?.right === pairIndex,
              })}`}
            >
              {pairs[pairIndex].translation}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { generateWordChainRound, WORD_CHAIN_SENTENCES, QUIZ_TARGET_LANGUAGES, trackSeenIds, LANGUAGES } from "langmighty-shared";
import { loadExtraSentences } from "../wordChainData.js";

const SENTENCE_COUNT = 6;
const WRONG_FLASH_MS = 400;
const WORDCHAIN_LANGUAGE_KEY = "langlearn_wordchain_language";

function languageLabel(key) {
  return LANGUAGES.find((l) => l.key === key)?.label ?? key;
}

function loadWordChainLanguage() {
  const saved = localStorage.getItem(WORDCHAIN_LANGUAGE_KEY);
  return QUIZ_TARGET_LANGUAGES.includes(saved) ? saved : QUIZ_TARGET_LANGUAGES[0];
}

export default function WordChainGame({ onExit }) {
  const [targetLanguage, setTargetLanguage] = useState(loadWordChainLanguage);
  // Sentence ids used in the round just played — passed as excludeIds so a replay
  // prefers fresh sentences over immediately reshowing the same ones.
  const recentIdsRef = useRef([]);
  // Starts as just the static bank; upgraded once the AI-generated + Redis-cached
  // extra sentences load (later rounds pick up the larger pool automatically).
  const [allSentences, setAllSentences] = useState(WORD_CHAIN_SENTENCES);

  useEffect(() => {
    let cancelled = false;
    loadExtraSentences().then((extra) => {
      if (!cancelled && extra.length > 0) setAllSentences([...WORD_CHAIN_SENTENCES, ...extra]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [sentences, setSentences] = useState(() => {
    const result = generateWordChainRound(SENTENCE_COUNT, { targetLanguage: loadWordChainLanguage() });
    recentIdsRef.current = result.usedIds;
    return result.sentences;
  });
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [chain, setChain] = useState([]); // ordered tileIds picked so far
  const [wrongFlashTileId, setWrongFlashTileId] = useState(null);
  const [mistakes, setMistakes] = useState(0);

  const finished = sentenceIndex >= sentences.length;

  function startNewRound(language, { resetHistory } = {}) {
    const excludeIds = resetHistory ? [] : recentIdsRef.current;
    const result = generateWordChainRound(SENTENCE_COUNT, { targetLanguage: language, excludeIds, allSentences });
    recentIdsRef.current = trackSeenIds(excludeIds, result.usedIds, allSentences.length);
    setSentences(result.sentences);
    setSentenceIndex(0);
    setChain([]);
    setWrongFlashTileId(null);
    setMistakes(0);
  }

  function handleRestart() {
    startNewRound(targetLanguage);
  }

  function handleLanguageChange(language) {
    setTargetLanguage(language);
    localStorage.setItem(WORDCHAIN_LANGUAGE_KEY, language);
    startNewRound(language, { resetHistory: true });
  }

  const controls = (
    <div className="flex items-center justify-center gap-2 mb-4 text-sm">
      <label htmlFor="wordchain-language" className="text-gray-500 dark:text-gray-400">
        Practicing:
      </label>
      <select
        id="wordchain-language"
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
  );

  if (finished) {
    return (
      <div>
        {controls}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950 px-6 py-14 text-center">
          <span className="text-5xl">🏆</span>
          <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">Round complete!</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {sentences.length} sentences built with{" "}
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

  const sentence = sentences[sentenceIndex];
  const isLastSentence = sentenceIndex === sentences.length - 1;
  const completed = chain.length === sentence.correctWords.length;
  const tileText = (tileId) => sentence.tiles.find((t) => t.tileId === tileId)?.text ?? "";

  function handleTileClick(tile) {
    if (completed || wrongFlashTileId || chain.includes(tile.tileId)) return;

    const expectedWord = sentence.correctWords[chain.length];
    if (tile.text === expectedWord) {
      setChain((prev) => [...prev, tile.tileId]);
    } else {
      setMistakes((m) => m + 1);
      setWrongFlashTileId(tile.tileId);
      setTimeout(() => setWrongFlashTileId(null), WRONG_FLASH_MS);
    }
  }

  function handleNext() {
    setChain([]);
    setWrongFlashTileId(null);
    setSentenceIndex((i) => i + 1);
  }

  const bankTiles = sentence.tiles.filter((t) => !chain.includes(t.tileId));

  return (
    <div>
      {controls}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
        <span>
          Sentence {sentenceIndex + 1} of {sentences.length}
        </span>
        <span className="font-medium text-indigo-600 dark:text-indigo-400">Mistakes: {mistakes}</span>
      </div>

      <div
        className={`rounded-2xl border px-6 py-8 transition-colors duration-300 ${
          completed
            ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950"
            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
        }`}
      >
        <p className="text-center text-lg font-medium text-gray-900 dark:text-gray-100">
          Build this sentence in {languageLabel(sentence.targetLanguage)}:
        </p>
        <p className="mt-1 text-center text-indigo-600 dark:text-indigo-400 font-medium">"{sentence.english}"</p>

        <div className="mt-5 flex flex-wrap justify-center gap-2 min-h-[3rem]">
          {sentence.correctWords.map((_, i) => (
            <span
              key={i}
              className={`inline-flex items-center rounded-lg border-2 px-3 py-2 text-base min-w-[3rem] justify-center ${
                chain[i]
                  ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                  : "border-dashed border-gray-300 dark:border-gray-700 text-gray-300 dark:text-gray-600"
              }`}
            >
              {chain[i] ? tileText(chain[i]) : "___"}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {bankTiles.map((tile) => (
            <button
              key={tile.tileId}
              type="button"
              onClick={() => handleTileClick(tile)}
              disabled={completed}
              className={`rounded-lg border-2 px-3 py-2 text-base transition-all ${
                wrongFlashTileId === tile.tileId
                  ? "border-red-400 bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400"
                  : "border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-gray-800 dark:text-gray-100"
              }`}
            >
              {tile.text}
            </button>
          ))}
        </div>

        {completed && (
          <div className="mt-5 text-center">
            <p className="text-2xl animate-bounce">🎉</p>
            <p className="font-semibold text-green-700 dark:text-green-300">Correct!</p>
            <button
              type="button"
              onClick={handleNext}
              className="mt-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors"
            >
              {isLastSentence ? "See results" : "Next sentence"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

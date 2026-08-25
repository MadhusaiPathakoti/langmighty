import { useState } from "react";
import GuessSentenceGame from "./GuessSentenceGame.jsx";
import ListenGuessGame from "./ListenGuessGame.jsx";
import QuizGame from "./QuizGame.jsx";
import ReadAloudGame from "./ReadAloudGame.jsx";
import ScenarioRoleplayGame from "./ScenarioRoleplayGame.jsx";
import SpeedTranslateGame from "./SpeedTranslateGame.jsx";
import WordChainGame from "./WordChainGame.jsx";
import WordMatchGame from "./WordMatchGame.jsx";

const GAMES = [
  {
    id: "read-aloud",
    emoji: "🎤",
    title: "Read Aloud",
    description: "Read a sentence out loud — we listen and check your pronunciation. Retry until you nail it.",
    available: true,
  },
  {
    id: "quiz",
    emoji: "🧠",
    title: "Language Quiz",
    description: "Multiple-choice: guess the translation across Kannada, Hindi, Malayalam, Tamil & Telugu.",
    available: true,
  },
  {
    id: "word-match",
    emoji: "🧩",
    title: "Word Match",
    description: "Tap each English word, then find its matching translation.",
    available: true,
  },
  {
    id: "speed-translate",
    emoji: "⚡",
    title: "Speed Translate",
    description: "60 seconds on the clock — answer as many translations correctly as you can.",
    available: true,
  },
  {
    id: "listen-guess",
    emoji: "🎧",
    title: "Listen & Guess",
    description: "Hear a word spoken aloud, then pick the matching written option.",
    available: true,
  },
  {
    id: "word-chain",
    emoji: "🔗",
    title: "Word Chain",
    description: "Build an English sentence's translation by tapping words in the right order.",
    available: true,
  },
  {
    id: "guess-sentence",
    emoji: "📝",
    title: "Guess the Sentence",
    description: "Multiple-choice, but for full sentences — each option comes with pronunciation.",
    available: true,
  },
  {
    id: "roleplay",
    emoji: "🎭",
    title: "Scenario Roleplay",
    description: "Chat your way through real scenes — order at a café, ask for directions — with an AI character.",
    available: true,
  },
];

export default function PlaygroundView() {
  const [activeGame, setActiveGame] = useState(null);

  if (activeGame) {
    return (
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setActiveGame(null)}
            className="mb-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ← Back to Playground
          </button>
          {activeGame === "quiz" && <QuizGame onExit={() => setActiveGame(null)} />}
          {activeGame === "word-match" && <WordMatchGame onExit={() => setActiveGame(null)} />}
          {activeGame === "speed-translate" && <SpeedTranslateGame onExit={() => setActiveGame(null)} />}
          {activeGame === "listen-guess" && <ListenGuessGame onExit={() => setActiveGame(null)} />}
          {activeGame === "word-chain" && <WordChainGame onExit={() => setActiveGame(null)} />}
          {activeGame === "guess-sentence" && <GuessSentenceGame onExit={() => setActiveGame(null)} />}
          {activeGame === "read-aloud" && <ReadAloudGame onExit={() => setActiveGame(null)} />}
          {activeGame === "roleplay" && <ScenarioRoleplayGame onExit={() => setActiveGame(null)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          🎮 Playground
        </h2>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Practice what you've learned with quick games.
        </p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {GAMES.map((game) => (
            <button
              key={game.id}
              type="button"
              disabled={!game.available}
              onClick={() => game.available && setActiveGame(game.id)}
              className={`relative text-left rounded-2xl border p-5 transition-colors ${
                game.available
                  ? "border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-gray-900 cursor-pointer"
                  : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-60 cursor-not-allowed"
              }`}
            >
              {!game.available && (
                <span className="absolute top-3 right-3 text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
                  Coming soon
                </span>
              )}
              <span className="text-2xl">{game.emoji}</span>
              <h3 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{game.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{game.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

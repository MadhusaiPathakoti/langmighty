import { createPortal } from "react-dom";
import LmLogo from "./LmLogo.jsx";
import { useAuthGate } from "../context/AuthGateContext.jsx";

// Singular/plural unit name per feature, so the limit count from the server
// (see api/_lib/usageLimits.js's LIMITS) can be shown directly in the copy
// instead of a vague "today's free X" with no number.
const UNITS = {
  translate: { singular: "translation", plural: "translations" },
  chat: { singular: "AI tutor message", plural: "AI tutor messages" },
  game: { singular: "play", plural: "plays" },
};

function buildMessage(feature, limit) {
  const unit = UNITS[feature];
  if (!unit || !limit) return "You've reached today's limit.";
  const label = limit === 1 ? unit.singular : unit.plural;

  // Each Playground game has its own once-(or a few times-)per-day play, not
  // a shared pool (see GAME_IDS/subKey in api/game-content.js) — other games
  // are still available, so this reads differently than the translate/chat
  // daily-count copy.
  if (feature === "game") return `You've used today's ${limit} free ${label} of this game — other games are still available.`;

  return `You've used today's ${limit} free ${label}/day.`;
}

// Shown when a request comes back 429 LIMIT_REACHED (see api/_lib/
// usageLimits.js) — a dismissible modal rather than SignInWall's full-view
// block, since hitting a daily cap shouldn't trap the visitor away from the
// rest of the app the way being signed out does.
export default function UpgradeWall({ onUpgrade }) {
  const { limitReached, dismissLimitReached } = useAuthGate();

  if (!limitReached) return null;

  const message = buildMessage(limitReached.feature, limitReached.limit);
  // Premium is the top tier — nothing left to upsell, so this becomes a
  // plain "come back tomorrow" notice instead of a pitch.
  const canUpgrade = limitReached.tier !== "premium";

  function handlePrimaryAction() {
    if (canUpgrade) onUpgrade?.();
    dismissLimitReached();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={dismissLimitReached}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <LmLogo className="w-14 h-14 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {canUpgrade ? "Come back tomorrow, or upgrade" : "Come back tomorrow"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {message} {canUpgrade ? "Upgrade for a higher daily limit, or it resets tomorrow." : "Your limit resets tomorrow."}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 text-sm transition-colors"
          >
            {canUpgrade ? "View plans" : "Got it"}
          </button>
          {canUpgrade && (
            <button
              type="button"
              onClick={dismissLimitReached}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Maybe later
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

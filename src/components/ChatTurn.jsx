import { useState } from "react";
import TranslationResults from "./TranslationResults.jsx";
import HandwrittenExportModal from "./HandwrittenExportModal.jsx";

export default function ChatTurn({ turn, onDelete, onRegenerate, disableActions }) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <div className="space-y-2 group">
      <div className="flex justify-end items-center gap-2">
        <button
          type="button"
          onClick={() => onDelete?.(turn.id)}
          className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-sm transition-colors"
          title="Delete this message"
          aria-label="Delete this message"
        >
          🗑
        </button>
        <div className="max-w-[80%] rounded-2xl bg-indigo-600 text-white px-4 py-2.5 text-sm">
          {turn.sourceText ?? turn.englishText}
        </div>
      </div>

      <div className="flex justify-start">
        <div className="max-w-full w-full sm:max-w-[90%]">
          {turn.status === "loading" && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm px-2 py-1">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              Translating...
            </div>
          )}

          {turn.status === "error" && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2">
              {turn.error}
            </div>
          )}

          {turn.status === "done" && (
            <>
              <TranslationResults results={turn.results} />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onRegenerate?.(turn.id)}
                  disabled={disableActions}
                  title="Get a fresh translation instead of the cached one"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↻ Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  ✎ Share as handwritten note
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showShareModal && <HandwrittenExportModal turn={turn} onClose={() => setShowShareModal(false)} />}
    </div>
  );
}

import TranslationResults from "./TranslationResults.jsx";

export default function ChatTurn({ turn }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-indigo-600 text-white px-4 py-2.5 text-sm">
          {turn.englishText}
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

          {turn.status === "done" && <TranslationResults results={turn.results} />}
        </div>
      </div>
    </div>
  );
}

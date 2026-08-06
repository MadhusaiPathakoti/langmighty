import { getInputLanguage } from "../languages.js";

export default function ChatInput({ value, onChange, onSubmit, loading, inputLanguage, error }) {
  function handleSubmit(e) {
    e.preventDefault();
    onSubmit();
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
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                     disabled:cursor-not-allowed text-white font-medium px-6 py-3 transition-colors"
        >
          {loading ? "..." : "Translate"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 px-2">{error}</p>}
    </div>
  );
}

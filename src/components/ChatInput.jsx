export default function ChatInput({ value, onChange, onSubmit, loading }) {
  function handleSubmit(e) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type an English sentence or phrase, e.g. What is your name?"
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
  );
}

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title="Toggle dark / light mode"
      className="rounded-full w-10 h-10 flex items-center justify-center border border-gray-300
                 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100
                 dark:hover:bg-gray-800 transition-colors"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

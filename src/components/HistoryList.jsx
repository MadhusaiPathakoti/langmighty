export default function HistoryList({ history, onSelect }) {
  if (history.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Recent Searches</h2>
      <ul className="flex flex-wrap gap-2">
        {history.map((item, i) => (
          <li key={item.timestamp + i}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="text-sm px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800
                         text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700
                         transition-colors"
            >
              {item.englishText}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

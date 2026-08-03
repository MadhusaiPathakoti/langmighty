export default function SpeakerButton({ enabled, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      title={enabled ? `Listen in ${label}` : `Voice not available for ${label} in your browser`}
      aria-label={`Listen in ${label}`}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-lg transition-colors
        ${
          enabled
            ? "bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 cursor-pointer"
            : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
        }`}
    >
      🔊
    </button>
  );
}

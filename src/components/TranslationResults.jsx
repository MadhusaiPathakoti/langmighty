import { useState } from "react";
import { LANGUAGES } from "langmighty-shared";
import SpeakerButton from "./SpeakerButton.jsx";

export default function TranslationResults({ results }) {
  const [copiedKey, setCopiedKey] = useState(null);

  function handleCopy(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    });
  }

  function copyButton(key, text) {
    return (
      <button
        type="button"
        onClick={() => handleCopy(key, text)}
        className="text-xs text-gray-400 hover:text-indigo-500"
        title="Copy translation"
      >
        {copiedKey === key ? "Copied!" : "📋"}
      </button>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards, one per language */}
      <div className="sm:hidden space-y-2">
        {LANGUAGES.map(({ key, label, ttsVoice }) => {
          const row = results[key];
          if (!row) return null;

          return (
            <div
              key={key}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{label}</span>
                <SpeakerButton text={row.translation} voice={ttsVoice} label={label} />
              </div>
              <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <span>{row.translation}</span>
                {copyButton(key, row.translation)}
              </div>
              <div className="text-gray-600 dark:text-gray-400 italic text-sm mt-1">{row.pronunciation}</div>
            </div>
          );
        })}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-3 py-2 font-semibold">Language</th>
              <th className="px-3 py-2 font-semibold">Translation</th>
              <th className="px-3 py-2 font-semibold">Pronunciation (Roman)</th>
              <th className="px-3 py-2 font-semibold text-center">Listen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {LANGUAGES.map(({ key, label, ttsVoice }) => {
              const row = results[key];
              if (!row) return null;

              return (
                <tr key={key} className="bg-white dark:bg-gray-900">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {label}
                  </td>
                  <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <span>{row.translation}</span>
                      {copyButton(key, row.translation)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400 italic">{row.pronunciation}</td>
                  <td className="px-3 py-2 text-center">
                    <SpeakerButton text={row.translation} voice={ttsVoice} label={label} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

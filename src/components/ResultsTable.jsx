import { useState } from "react";
import { LANGUAGES } from "../languages.js";
import SpeakerButton from "./SpeakerButton.jsx";
import { findVoiceForLang, speakText } from "../hooks/useSpeechVoices.js";

export default function ResultsTable({ results, voices }) {
  const [copiedKey, setCopiedKey] = useState(null);

  function handleCopy(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          <tr>
            <th className="px-4 py-3 font-semibold">Language</th>
            <th className="px-4 py-3 font-semibold">Translation</th>
            <th className="px-4 py-3 font-semibold">Native Script</th>
            <th className="px-4 py-3 font-semibold">Pronunciation (Roman)</th>
            <th className="px-4 py-3 font-semibold text-center">Listen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {LANGUAGES.map(({ key, label, ttsLang }) => {
            const row = results[key];
            if (!row) return null;
            const hasVoice = Boolean(findVoiceForLang(voices, ttsLang));

            return (
              <tr key={key} className="bg-white dark:bg-gray-900">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {label}
                </td>
                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <span>{row.translation}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${key}-t`, row.translation)}
                      className="text-xs text-gray-400 hover:text-indigo-500"
                      title="Copy translation"
                    >
                      {copiedKey === `${key}-t` ? "Copied!" : "📋"}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{row.script}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 italic">{row.pronunciation}</td>
                <td className="px-4 py-3 text-center">
                  <SpeakerButton
                    enabled={hasVoice}
                    label={label}
                    onClick={() => speakText(row.script, ttsLang, voices)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

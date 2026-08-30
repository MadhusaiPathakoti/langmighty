import useDocumentMeta from "../../hooks/useDocumentMeta.js";
import { LANGUAGE_INFO, TRANSLATOR_PAIRS } from "./seoContent.js";
import SeoPageShell, { SeoCta } from "./SeoPageShell.jsx";

// Every pair links to its siblings sharing the same source language (e.g. the
// Telugu-to-Hindi page links to Telugu-to-Kannada, -Malayalam, -Tamil) so
// crawlers can reach all 25 translator pages by following links, not just via
// the sitemap — the footer only surfaces the 5 English-source pages.
function siblingPairs(fromKey, toKey) {
  return TRANSLATOR_PAIRS.filter((p) => p.from === fromKey && p.to !== toKey);
}

export default function TranslatorLandingPage({ fromKey, toKey }) {
  const from = LANGUAGE_INFO[fromKey];
  const to = LANGUAGE_INFO[toKey];
  const title = `${from.label} to ${to.label} Translator — Free AI Translation | LangMighty`;
  const description = `Translate ${from.label} to ${to.label} (${to.nativeName}) instantly with LangMighty — free AI-powered translation with native pronunciation, romanized transliteration, and saved history.`;

  useDocumentMeta({ title, description, path: `/${from.key}-to-${to.key}-translator` });

  const siblings = siblingPairs(fromKey, toKey);

  return (
    <SeoPageShell ctaTo={`/?start=chat&to=${to.key}`} ctaLabel={`Translate to ${to.label} →`}>
      <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">
        {from.label} to {to.label} Translator
      </h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        Translate any {from.label} sentence into {to.label} ({to.nativeName}) for free, with native-voice
        pronunciation and a romanized guide so you can read it out loud even before you've learned the{" "}
        {to.script}. {to.label} is spoken by {to.speakers}.
      </p>

      <div className="mt-8">
        <SeoCta to={`/?start=chat&to=${to.key}`}>Translate to {to.label} now →</SeoCta>
      </div>

      <div className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-900">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Example — both translate "Good morning! How are you?"
        </p>
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          {from.label}: {from.example.translation}
          {from.example.pronunciation && (
            <span className="text-gray-500 dark:text-gray-400 italic"> ({from.example.pronunciation})</span>
          )}
        </p>
        <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">{to.example.translation}</p>
        <p className="mt-1 text-gray-500 dark:text-gray-400 italic">{to.example.pronunciation}</p>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {[
          ["Accurate AI translation", `Powered by AI, tuned specifically for natural, everyday ${to.label}.`],
          ["Native pronunciation", `Hear every translation spoken aloud in a native ${to.label} voice.`],
          [
            "Romanized transliteration",
            `Read the ${to.label} script phonetically in English letters until you learn the ${to.script}.`,
          ],
          ["Saved history", "Every translation is saved automatically so you can revisit or export it later."],
        ].map(([heading, body]) => (
          <div key={heading} className="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{heading}</h2>
            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{body}</p>
          </div>
        ))}
      </div>

      {siblings.length > 0 && (
        <div className="mt-10">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">More {from.label} translators</h2>
          <div className="flex flex-wrap gap-2">
            {siblings.map((p) => (
              <a
                key={p.to}
                href={`/${p.from}-to-${p.to}-translator`}
                className="text-sm rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                {from.label} to {LANGUAGE_INFO[p.to].label}
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="mt-10 text-gray-600 dark:text-gray-400">
        Want to go beyond single sentences? LangMighty also has an{" "}
        <a href="/ai-language-tutor" className="text-indigo-600 dark:text-indigo-400 underline">
          AI language tutor
        </a>{" "}
        for practicing full conversations, and a{" "}
        <a href={`/learn-${to.key}-online`} className="text-indigo-600 dark:text-indigo-400 underline">
          guided roadmap for learning {to.label} online
        </a>
        , from the alphabet up.
      </p>
    </SeoPageShell>
  );
}

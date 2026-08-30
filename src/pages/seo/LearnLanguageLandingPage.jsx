import { ROADMAP_STAGES } from "langmighty-shared";
import useDocumentMeta from "../../hooks/useDocumentMeta.js";
import { LANGUAGE_INFO } from "./seoContent.js";
import SeoPageShell, { SeoCta } from "./SeoPageShell.jsx";

const PREVIEW_STAGES = ROADMAP_STAGES.slice(0, 5);

export default function LearnLanguageLandingPage({ languageKey }) {
  const lang = LANGUAGE_INFO[languageKey];
  const title = `Learn ${lang.label} Online — Free Guided Roadmap | LangMighty`;
  const description = `Learn ${lang.label} (${lang.nativeName}) online for free with LangMighty's guided roadmap — from the alphabet to everyday vocabulary, plus an AI tutor and practice games.`;

  useDocumentMeta({ title, description, path: `/learn-${lang.key}-online` });

  return (
    <SeoPageShell ctaTo={`/?start=roadmap&lang=${lang.key}`} ctaLabel={`Start learning ${lang.label} →`}>
      <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">
        Learn {lang.label} Online
      </h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        LangMighty's free roadmap teaches you to read, write, and speak {lang.label} ({lang.nativeName}) step by
        step — starting from the {lang.script} itself, all the way through everyday vocabulary and conversation.{" "}
        {lang.label} is spoken by {lang.speakers}.
      </p>

      <div className="mt-8">
        <SeoCta to={`/?start=roadmap&lang=${lang.key}`}>Start the {lang.label} roadmap →</SeoCta>
      </div>

      <div className="mt-10">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          The first steps of the {lang.label} learning roadmap
        </h2>
        <ol className="space-y-4">
          {PREVIEW_STAGES.map((stage) => (
            <li key={stage.id} className="flex gap-4 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <span className="flex-none w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center">
                {stage.number}
              </span>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{stage.title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{stage.blurb}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          ...and more stages after that, covering vocabulary you'll actually use.
        </p>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {[
          [
            "Practice games",
            `Reinforce what you learn with quizzes, word matching, and listening games built around ${lang.label}.`,
          ],
          [
            "AI tutor & translator",
            `Ask questions about grammar or vocabulary any time, or translate a sentence into ${lang.label} instantly.`,
          ],
        ].map(([heading, body]) => (
          <div key={heading} className="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{heading}</h2>
            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{body}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-gray-600 dark:text-gray-400">
        Just need a quick translation instead? Try the{" "}
        <a href={`/english-to-${lang.key}-translator`} className="text-indigo-600 dark:text-indigo-400 underline">
          English to {lang.label} translator
        </a>
        .
      </p>
    </SeoPageShell>
  );
}

import { INPUT_LANGUAGES } from "langmighty-shared";

export default function SupportedLanguagesSection() {
  return (
    <section id="languages" className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Supported{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Languages
            </span>
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Translate between English and five South Indian languages, in any direction.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {INPUT_LANGUAGES.map((lang) => (
            <div
              key={lang.key}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 text-center"
            >
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{lang.nativeName}</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{lang.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { FEATURES, colorClasses } from "./landingContent.js";

function scrollToFeature(e, id) {
  e.preventDefault();
  document.querySelector(`#feature-${id}`)?.scrollIntoView({ behavior: "smooth" });
}

export default function FeaturesOverviewSection() {
  return (
    <section id="features" className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 text-xs font-medium px-3 py-1 mb-4">
            ⭐ Powerful Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Learn &amp; Translate
            </span>
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            LangMighty combines AI technology with language learning to give you the best translation experience.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6"
            >
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorClasses(feature.color)}`}>
                {feature.emoji}
              </span>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
              <a
                href={`#feature-${feature.id}`}
                onClick={(e) => scrollToFeature(e, feature.id)}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Learn more →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

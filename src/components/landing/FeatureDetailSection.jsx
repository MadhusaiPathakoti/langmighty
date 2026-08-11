import { colorClasses } from "./landingContent.js";
import MockupPreview from "./MockupPreview.jsx";

export default function FeatureDetailSection({ feature, reversed, tinted }) {
  return (
    <section
      id={`feature-${feature.id}`}
      className={`px-4 sm:px-6 py-14 sm:py-16 ${tinted ? "bg-gray-50 dark:bg-gray-900/40" : ""}`}
    >
      <div className={`max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div>
          <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorClasses(feature.color)}`}>
            {feature.emoji}
          </span>
          <h3 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{feature.title}</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">{feature.description}</p>

          <ul className="mt-5 space-y-2.5">
            {feature.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="mt-0.5 text-emerald-500">✓</span>
                {bullet}
              </li>
            ))}
          </ul>

          {feature.note && (
            <p className={`mt-5 rounded-lg px-4 py-3 text-sm font-medium ${colorClasses(feature.color)}`}>
              ✨ {feature.note}
            </p>
          )}
        </div>

        <MockupPreview type={feature.mockup} />
      </div>
    </section>
  );
}

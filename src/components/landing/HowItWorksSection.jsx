import { HOW_IT_WORKS_STEPS } from "./landingContent.js";

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 sm:px-6 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            How It{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">From a sentence to a spoken translation in four steps.</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold">
                {step.number}
              </span>
              <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

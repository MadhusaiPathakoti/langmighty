import { TRUST_AVATARS, STATS, colorClasses } from "./landingContent.js";
import MockupPreview from "./MockupPreview.jsx";
import mandalaArt from "../../media/mandala_art.webp";

function scrollToFeatures(e) {
  e.preventDefault();
  document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" });
}

// Scattered along the hero's outer margins (not the centered content column)
// so they never sit under the headline/CTAs even on very wide viewports.
// Each carries its own color, size, tilt (--float-rotate) and animation
// timing so the bobbing motion reads as organic rather than synchronized.
const FLOATING_LETTERS = [
  { char: "అ", top: "3%", left: "5%", size: "2.1rem", rotate: -12, delay: "0s", duration: "6s", color: "text-amber-600 dark:text-amber-300" },
  { char: "अ", top: "8%", left: "40%", size: "1.8rem", rotate: 9, delay: "0.9s", duration: "5.4s", color: "text-sky-600 dark:text-sky-300" },
  { char: "ಅ", top: "5%", left: "94%", size: "2.3rem", rotate: -7, delay: "1.5s", duration: "6.6s", color: "text-emerald-600 dark:text-emerald-300" },
  { char: "ആ", top: "24%", left: "2%", size: "1.7rem", rotate: 14, delay: "2.1s", duration: "5.1s", color: "text-purple-600 dark:text-purple-300" },
  { char: "ஆ", top: "90%", left: "8%", size: "2rem", rotate: -10, delay: "0.4s", duration: "6.2s", color: "text-rose-600 dark:text-rose-300" },
  { char: "இ", top: "94%", left: "44%", size: "1.8rem", rotate: 9, delay: "1.2s", duration: "5.7s", color: "text-orange-600 dark:text-orange-300" },
  { char: "ई", top: "90%", left: "78%", size: "2.1rem", rotate: -8, delay: "1.8s", duration: "6.3s", color: "text-teal-600 dark:text-teal-300" },
  { char: "ಆ", top: "32%", left: "97%", size: "1.9rem", rotate: 11, delay: "0.6s", duration: "5.3s", color: "text-pink-600 dark:text-pink-300" },
];

export default function HeroSection({ onGetStarted }) {
  return (
    <section id="home" className="relative overflow-hidden px-4 sm:px-6 py-14 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-purple-200/40 dark:bg-purple-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-indigo-200/40 dark:bg-indigo-500/10 blur-3xl"
      />

      {/* Anchored mostly off the left edge — the section's overflow-hidden
          clips it down to a slowly-rotating semi-circle sliver. rounded-full
          crops the source image's square canvas down to just the circular
          artwork, and opacity lets the page's own background show through. */}
      <img
        src={mandalaArt}
        alt=""
        aria-hidden="true"
        className="hidden sm:block pointer-events-none absolute top-1/2 -left-48 md:-left-56 -translate-y-1/2 w-[420px] h-[420px] md:w-[520px] md:h-[520px] rounded-full object-cover opacity-20 dark:opacity-15 animate-spin-slow"
      />

      {FLOATING_LETTERS.map((l, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`hidden sm:block pointer-events-none absolute font-extrabold animate-float ${l.color}`}
          style={{
            top: l.top,
            left: l.left,
            fontSize: l.size,
            "--float-rotate": `${l.rotate}deg`,
            animationDelay: l.delay,
            animationDuration: l.duration,
          }}
        >
          {l.char}
        </span>
      ))}

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-xs font-medium px-3 py-1 mb-5">
            ✨ AI-Powered Language Learning
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">
            Translate. Learn.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Connect.
            </span>
          </h1>

          <p className="mt-5 text-gray-600 dark:text-gray-400 text-lg max-w-lg">
            LangMighty helps you translate sentences across 5 South Indian languages and Hindi with pronunciation,
            smart history, and AI chat.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-3 text-sm transition-colors"
            >
              Try LangMighty Now →
            </button>
            <a
              href="#features"
              onClick={scrollToFeatures}
              className="rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium px-5 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {TRUST_AVATARS.map((a, i) => (
                <span
                  key={i}
                  className={`w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-950 flex items-center justify-center text-xs font-semibold ${colorClasses(a.color)}`}
                >
                  {a.initials}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trusted by <span className="font-semibold text-gray-700 dark:text-gray-200">1,000+ learners</span> across
              the globe
            </p>
          </div>
        </div>

        <div className="relative">
          {/* Floating greeting bubbles — echoes the social banner's motif, hidden on
              small screens where there's no room around the mockup card. */}
          <span
            aria-hidden="true"
            className="hidden lg:inline-flex absolute -top-6 -left-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 shadow-sm"
          >
            Hello
          </span>
          <span
            aria-hidden="true"
            className="hidden lg:inline-flex absolute -top-3 right-8 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-semibold px-3 py-1.5 shadow-sm"
          >
            नमस्ते
          </span>
          <span
            aria-hidden="true"
            className="hidden lg:inline-flex absolute -bottom-4 -right-6 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-3 py-1.5 shadow-sm"
          >
            வணக்கம்
          </span>
          <span aria-hidden="true" className="hidden lg:block absolute -top-10 right-1/3 text-xl -rotate-12">
            ✈️
          </span>

          <MockupPreview type="translation" />
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

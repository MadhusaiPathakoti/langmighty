import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CulturalBackground from "../../components/CulturalBackground.jsx";
import LandingFooter from "../../components/landing/LandingFooter.jsx";
import LmLogo from "../../components/LmLogo.jsx";
import ThemeToggle from "../../components/ThemeToggle.jsx";

const THEME_KEY = "langlearn_theme";

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// A lighter-weight shell than App.jsx's <NavBar> — these SEO pages are
// standalone entry points a search visitor lands on directly, not part of
// the signed-in app shell, so they only need the logo, a theme toggle
// (mirroring App.jsx's own THEME_KEY so the choice is consistent site-wide),
// and a single CTA into the real app.
export default function SeoPageShell({ ctaTo, ctaLabel = "Try LangMighty Now →", children }) {
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <div className="min-h-dvh bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <CulturalBackground />
      <div className="relative z-10">
        <nav className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <LmLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              LangMighty
            </span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
            <Link
              to={ctaTo}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <main className="px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-3xl mx-auto">{children}</div>
        </main>

        <div className="mt-auto">
          <LandingFooter />
        </div>
      </div>
    </div>
  );
}

export function SeoCta({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-3 text-sm transition-colors"
    >
      {children}
    </Link>
  );
}

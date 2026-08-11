import LmLogo from "../LmLogo.jsx";
import ThemeToggle from "../ThemeToggle.jsx";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#languages", label: "Supported Languages" },
  { href: "#faq", label: "FAQ" },
  { href: "#about", label: "About" },
];

function scrollToHash(e, href) {
  e.preventDefault();
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
}

export default function LandingNav({ onGetStarted, theme, onToggleTheme }) {
  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <a href="#home" onClick={(e) => scrollToHash(e, "#home")} className="flex items-center gap-2 group shrink-0">
        <span className="w-8 h-8 group-hover:scale-105 transition-transform">
          <LmLogo className="w-full h-full object-contain" />
        </span>
        <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          LangMighty
        </span>
      </a>

      <div className="hidden md:flex items-center gap-1 flex-wrap">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => scrollToHash(e, link.href)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button
          type="button"
          onClick={onGetStarted}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors"
        >
          Get Started
        </button>
      </div>
    </nav>
  );
}

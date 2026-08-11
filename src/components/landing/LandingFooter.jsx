import LmLogo from "../LmLogo.jsx";
import { SOCIAL_LINKS } from "./socialLinks.jsx";

export default function LandingFooter() {
  return (
    <footer className="px-4 sm:px-6 py-8 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <LmLogo className="w-7 h-7" />
          <span className="font-bold text-gray-900 dark:text-gray-100">LangMighty</span>
        </div>

        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.href}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              title={social.label}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="w-5 h-5">{social.icon}</span>
            </a>
          ))}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} LangMighty. Built for learning Indian languages.
        </p>
      </div>
    </footer>
  );
}

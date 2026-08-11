import LmLogo from "../LmLogo.jsx";

export default function LandingFooter() {
  return (
    <footer className="px-4 sm:px-6 py-8 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7">
            <LmLogo className="w-full h-full object-contain" />
          </span>
          <span className="font-bold text-gray-900 dark:text-gray-100">LangMighty</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} LangMighty. Built for learning Indian languages.
        </p>
      </div>
    </footer>
  );
}
